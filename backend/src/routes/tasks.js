import { crudRouter, assertOwned } from '../utils/crud.js';
import { v } from '../utils/fields.js';
import { idFilter, inFilter, textFilter, dateFilter, priorityRank } from '../utils/listing.js';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

export default crudRouter({
  table: 'tasks',
  alias: 't',
  names: ['task', 'tasks'],
  select: `SELECT t.id, t.goal_id, t.title, t.notes, t.category, t.priority, t.status,
      t.due_date, t.completed_at, t.created_at, t.updated_at, g.title AS goal_title
    FROM tasks t LEFT JOIN goals g ON g.id = t.goal_id`,
  fields: {
    goal_id: v.id({ nullable: true }), // null detaches the task from its goal
    title: v.text({ max: 200 }),
    notes: v.text({ max: 10_000, blank: true }),
    category: v.text({ max: 50, nullable: true }),
    priority: v.oneOf(PRIORITIES),
    status: v.oneOf(STATUSES),
    due_date: v.date({ nullable: true }),
  },
  required: ['title'],
  listConfig: {
    filters: {
      // goal_id=none lists standalone tasks
      goal_id: (val, add) => (val === 'none' ? 't.goal_id IS NULL' : idFilter('t.goal_id')(val, add)),
      status: inFilter('t.status', STATUSES),
      priority: inFilter('t.priority', PRIORITIES),
      category: textFilter('t.category'),
      due_from: dateFilter('t.due_date', '>='),
      due_to: dateFilter('t.due_date', '<='),
    },
    sorts: {
      due: { expr: 't.due_date', dir: 'asc' },
      priority: { expr: priorityRank('t.priority'), dir: 'desc' },
      status: { expr: `array_position(ARRAY['todo','in_progress','done'], t.status)`, dir: 'asc' },
      category: { expr: 't.category', dir: 'asc' },
      created: { expr: 't.created_at', dir: 'desc' },
    },
    defaultSort: 'due',
  },
  async prepare(values, existing, userId) {
    if (values.goal_id != null) await assertOwned('goals', values.goal_id, userId, 'goal_id');
    if (values.status !== undefined) {
      const wasDone = existing?.status === 'done';
      if (values.status === 'done' && !wasDone) values.completed_at = new Date();
      if (values.status !== 'done') values.completed_at = null;
    }
  },
});
