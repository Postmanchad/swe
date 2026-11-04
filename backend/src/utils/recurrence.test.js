import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expandEvent, zonedToUtc } from './recurrence.js';
import { validateEvent } from './validate.js';

const iso = (d) => d.toISOString();

// A class every Monday and Wednesday, 10:00-11:00 New York time, starting Mon Oct 26 2026 (EDT).
const cls = {
  id: 1, title: 'COSC 369', notes: '', all_day: false, color: null,
  start_time: '2026-10-26T14:00:00Z', end_time: '2026-10-26T15:00:00Z',
  recurrence_days: [1, 3], recurrence_until: null, tz: 'America/New_York',
};

test('zonedToUtc handles standard and daylight time', () => {
  assert.equal(iso(zonedToUtc(2026, 1, 12, 10, 0, 'America/New_York')), '2026-01-12T15:00:00.000Z');
  assert.equal(iso(zonedToUtc(2026, 3, 9, 10, 0, 'America/New_York')), '2026-03-09T14:00:00.000Z');
});

test('one-off event is returned only when it overlaps the range', () => {
  const ev = { ...cls, recurrence_days: null };
  assert.equal(expandEvent(ev, new Date('2026-10-25T00:00:00Z'), new Date('2026-10-27T00:00:00Z')).length, 1);
  assert.equal(expandEvent(ev, new Date('2026-10-27T00:00:00Z'), new Date('2026-10-28T00:00:00Z')).length, 0);
});

test('weekly Mon/Wed class keeps 10:00 local time across the Nov 1 2026 DST change', () => {
  const out = expandEvent(cls, new Date('2026-10-26T00:00:00Z'), new Date('2026-11-06T00:00:00Z'));
  assert.deepEqual(out.map((o) => iso(o.start_time)), [
    '2026-10-26T14:00:00.000Z', // Mon, EDT
    '2026-10-28T14:00:00.000Z', // Wed, EDT
    '2026-11-02T15:00:00.000Z', // Mon, EST
    '2026-11-04T15:00:00.000Z', // Wed, EST
  ]);
  assert.ok(out.every((o) => o.recurring && o.end_time - o.start_time === 3_600_000));
});

test('no occurrences before the series start date', () => {
  const out = expandEvent(cls, new Date('2026-10-01T00:00:00Z'), new Date('2026-10-26T00:00:00Z'));
  assert.equal(out.length, 0);
});

test('recurrence_until stops the series', () => {
  const ev = { ...cls, recurrence_until: '2026-10-29T00:00:00Z' };
  const out = expandEvent(ev, new Date('2026-10-26T00:00:00Z'), new Date('2026-12-01T00:00:00Z'));
  assert.equal(out.length, 2);
});

test('a year range expands within the safety cap', () => {
  const out = expandEvent(cls, new Date('2026-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'));
  assert.ok(out.length > 10 && out.length < 200);
});

test('validateEvent accepts a good event and normalises weekdays', () => {
  const { value, error } = validateEvent({ ...cls, recurrence_days: [3, 1, 1] });
  assert.equal(error, undefined);
  assert.deepEqual(value.recurrence_days, [1, 3]);
});

test('validateEvent rejects bad input', () => {
  assert.match(validateEvent({ ...cls, title: '  ' }).error, /title/);
  assert.match(validateEvent({ ...cls, end_time: cls.start_time }).error, /after/);
  assert.match(validateEvent({ ...cls, recurrence_days: [7] }).error, /recurrence_days/);
  assert.match(validateEvent({ ...cls, color: 'red' }).error, /color/);
  assert.match(validateEvent({ ...cls, tz: 'Mars/Base' }).error, /tz/);
  assert.match(validateEvent({ ...cls, recurrence_days: null, recurrence_until: '2027-01-01T00:00:00Z' }).error, /requires/);
});
