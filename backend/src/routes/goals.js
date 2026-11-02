import { crudRouter } from '../utils/crud.js';
import { v } from '../utils/fields.js';
import { inFilter, textFilter, priorityRank } from '../utils/listing.js';

const KINDS = ['short_term', 'long_term'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['active', 'completed', 'abandoned'];

// progress (0-100) is computed from the goal's tasks: done / total.
export default crudRouter({
  table: 'goals',
  alias: 'g',
  names: ['goal', 'goals'],
  select: `SELECT g.id, g.title, g.description, g.kind, g.category, g.priority, g.status,
      g.target_date, g.completed_at, g.created_at, g.updated_at,
      s.total AS task_total, s.done AS task_done,
      CASE WHEN s.total = 0 THEN (CASE WHEN g.status = 'completed' THEN 100 ELSE 0 END)
           ELSE round(100.0 * s.done / s.total)::int END AS progress
    FROM goals g
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS total, (count(*) FILTER (WHERE t.status = 'done'))::int AS done
      FROM tasks t WHERE t.goal_id = g.id
    ) s ON true`,
  fields: {
    title: v.text({ max: 200 }),
    description: v.text({ max: 5000, blank: true }),
    kind: v.oneOf(KINDS),
    category: v.text({ max: 50, nullable: true }),
    priority: v.oneOf(PRIORITIES),
    status: v.oneOf(STATUSES),
    target_date: v.date({ nullable: true }),
  },
  required: ['title'],
  listConfig: {
    filters: {
      kind: inFilter('g.kind', KINDS),
      status: inFilter('g.status', STATUSES),
      priority: inFilter('g.priority', PRIORITIES),
      category: textFilter('g.category'),
    },
    sorts: {
      target: { expr: 'g.target_date', dir: 'asc' },
      priority: { expr: priorityRank('g.priority'), dir: 'desc' },
      progress: { expr: 'progress', dir: 'desc' },
      created: { expr: 'g.created_at', dir: 'desc' },
    },
    defaultSort: 'target',
  },
  async prepare(values, existing) {
    if (values.status !== undefined) {
      const wasCompleted = existing?.status === 'completed';
      if (values.status === 'completed' && !wasCompleted) values.completed_at = new Date();
      if (values.status !== 'completed') values.completed_at = null;
    }
  },
});
