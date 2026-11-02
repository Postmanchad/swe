import { test } from 'node:test';
import assert from 'node:assert/strict';
import { v, validateBody, parseMonth, parseDate, parseId, HttpError } from './fields.js';
import { buildList, inFilter, idFilter, priorityRank } from './listing.js';

const throwsHttp = (fn, re) =>
  assert.throws(fn, (e) => e instanceof HttpError && e.status === 400 && re.test(e.message));

test('parseDate and parseMonth', () => {
  assert.equal(parseDate('2026-11-30'), '2026-11-30');
  assert.equal(parseDate('2026-02-30'), null);
  assert.equal(parseDate('11/30/2026'), null);
  assert.equal(parseMonth('2026-11'), '2026-11-01');
  assert.equal(parseMonth('2026-11-17'), '2026-11-01');
  assert.equal(parseMonth('2026-13'), null);
  assert.equal(parseMonth(5), null);
});

test('parseId rejects junk', () => {
  assert.equal(parseId('42'), 42);
  throwsHttp(() => parseId('4x'), /Invalid id/);
  throwsHttp(() => parseId('-1'), /Invalid id/);
});

const spec = {
  title: v.text({ max: 10 }),
  notes: v.text({ blank: true }),
  category: v.text({ max: 20, nullable: true }),
  priority: v.oneOf(['low', 'medium', 'high']),
  due_date: v.date({ nullable: true }),
  goal_id: v.id({ nullable: true }),
  due_at: v.timestamp(),
};

test('validateBody: required, trimming, nulls and blanks', () => {
  const out = validateBody(spec, { title: '  Essay ', notes: '', category: '  ', goal_id: null }, { required: ['title'] });
  assert.deepEqual(out, { title: 'Essay', notes: '', category: null, goal_id: null });
  throwsHttp(() => validateBody(spec, {}, { required: ['title'] }), /title is required/);
  assert.deepEqual(validateBody(spec, {}, { partial: true }), {}); // PATCH with nothing is fine
});

test('validateBody: rejects bad values with the field name', () => {
  throwsHttp(() => validateBody(spec, { title: 'x'.repeat(11) }, { partial: true }), /title must be at most 10/);
  throwsHttp(() => validateBody(spec, { title: '   ' }, { partial: true }), /title may not be empty/);
  throwsHttp(() => validateBody(spec, { priority: 'urgent' }, { partial: true }), /priority must be one of/);
  throwsHttp(() => validateBody(spec, { due_date: '2026-02-30' }, { partial: true }), /due_date/);
  throwsHttp(() => validateBody(spec, { goal_id: '3' }, { partial: true }), /goal_id/);
  throwsHttp(() => validateBody(spec, { title: null }, { partial: true }), /title may not be null/);
  throwsHttp(() => validateBody(spec, { due_at: 'soon' }, { partial: true }), /due_at/);
});

test('validateBody ignores unknown fields, including user_id', () => {
  assert.deepEqual(validateBody(spec, { title: 'A', user_id: 99, id: 1 }, { required: ['title'] }), { title: 'A' });
});

const fakeReq = (query) => ({ userId: 7, query });
const base = { alias: 'a', select: 'SELECT a.* FROM assignments a' };
const sorts = {
  due: { expr: 'a.due_at', dir: 'asc' },
  priority: { expr: priorityRank('a.priority'), dir: 'desc' },
};

test('buildList: default query is scoped to the user and paged', () => {
  const { sql, params } = buildList(fakeReq({}), { ...base, sorts, defaultSort: 'due' });
  assert.match(sql, /WHERE a\.user_id = \$1 ORDER BY a\.due_at ASC NULLS LAST, a\.id ASC LIMIT \$2 OFFSET \$3$/);
  assert.deepEqual(params, [7, 200, 0]);
});

test('buildList: filters, sort override and order', () => {
  const filters = {
    status: inFilter('a.status', ['todo', 'in_progress', 'submitted']),
    course_id: idFilter('a.course_id'),
  };
  const { sql, params } = buildList(
    fakeReq({ status: 'todo,in_progress', course_id: '3', sort: 'priority', order: 'ASC', limit: '10', offset: '20' }),
    { ...base, filters, sorts, defaultSort: 'due' },
  );
  assert.match(sql, /a\.status = ANY\(\$2\) AND a\.course_id = \$3/);
  assert.match(sql, /ORDER BY CASE a\.priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END ASC NULLS LAST/);
  assert.deepEqual(params, [7, ['todo', 'in_progress'], 3, 10, 20]);
});

test('buildList: user input never reaches the SQL text', () => {
  const filters = { status: inFilter('a.status', ['todo']) };
  throwsHttp(() => buildList(fakeReq({ status: "todo'; DROP TABLE users;--" }), { ...base, filters, sorts, defaultSort: 'due' }), /status: must be one of/);
  throwsHttp(() => buildList(fakeReq({ sort: 'a.id; DROP TABLE users' }), { ...base, sorts, defaultSort: 'due' }), /sort must be one of/);
  throwsHttp(() => buildList(fakeReq({ order: 'sideways' }), { ...base, sorts, defaultSort: 'due' }), /order/);
  throwsHttp(() => buildList(fakeReq({ limit: 'abc' }), { ...base, sorts, defaultSort: 'due' }), /limit/);
});

test('buildList: limit is capped at 500', () => {
  const { params } = buildList(fakeReq({ limit: '99999' }), { ...base, sorts, defaultSort: 'due' });
  assert.equal(params[1], 500);
});
