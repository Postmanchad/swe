import { crudRouter, assertOwned } from '../utils/crud.js';
import { HttpError, v } from '../utils/fields.js';
import { idFilter, inFilter, timeFilter, priorityRank } from '../utils/listing.js';

export const PRIORITIES = ['low', 'medium', 'high'];
export const STATUSES = ['todo', 'in_progress', 'submitted', 'graded'];
const OVERDUE = `(a.due_at < now() AND a.status IN ('todo', 'in_progress'))`;
const isDone = (status) => status === 'submitted' || status === 'graded';

export default crudRouter({
  table: 'assignments',
  alias: 'a',
  names: ['assignment', 'assignments'],
  select: `SELECT a.id, a.course_id, a.title, a.notes, a.due_at, a.submitted_at, a.priority, a.status,
      a.created_at, a.updated_at,
      c.name AS course_name, c.code AS course_code, c.color AS course_color,
      ${OVERDUE} AS overdue
    FROM assignments a JOIN courses c ON c.id = a.course_id`,
  fields: {
    course_id: v.id(),
    title: v.text({ max: 200 }),
    notes: v.text({ max: 10_000, blank: true }),
    due_at: v.timestamp(),
    submitted_at: v.timestamp({ nullable: true }),
    priority: v.oneOf(PRIORITIES),
    status: v.oneOf(STATUSES),
  },
  required: ['course_id', 'title', 'due_at'],
  listConfig: {
    filters: {
      course_id: idFilter('a.course_id'),
      status: inFilter('a.status', STATUSES),
      priority: inFilter('a.priority', PRIORITIES),
      due_from: timeFilter('a.due_at', '>='),
      due_to: timeFilter('a.due_at', '<'),
      overdue: (val) => {
        if (val === 'true') return OVERDUE;
        if (val === 'false') return `NOT ${OVERDUE}`;
        throw new HttpError(400, 'must be true or false');
      },
    },
    sorts: {
      due: { expr: 'a.due_at', dir: 'asc' },
      priority: { expr: priorityRank('a.priority'), dir: 'desc' },
      status: { expr: `array_position(ARRAY['todo','in_progress','submitted','graded'], a.status)`, dir: 'asc' },
      course: { expr: 'c.name', dir: 'asc' },
      created: { expr: 'a.created_at', dir: 'desc' },
    },
    defaultSort: 'due',
  },
  async prepare(values, existing, userId) {
    if (values.course_id !== undefined) await assertOwned('courses', values.course_id, userId, 'course_id');
    // Stamp or clear the submission time when the status moves, unless the client set it explicitly.
    if (values.status !== undefined && values.submitted_at === undefined) {
      const wasDone = existing ? isDone(existing.status) : false;
      if (isDone(values.status) && !wasDone) values.submitted_at = new Date();
      if (!isDone(values.status)) values.submitted_at = null;
    }
  },
});
