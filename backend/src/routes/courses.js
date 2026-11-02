import { crudRouter } from '../utils/crud.js';
import { v } from '../utils/fields.js';
import { textFilter } from '../utils/listing.js';

export default crudRouter({
  table: 'courses',
  alias: 'c',
  names: ['course', 'courses'],
  select: `SELECT c.*,
    (SELECT count(*)::int FROM assignments a
       WHERE a.course_id = c.id AND a.status IN ('todo', 'in_progress')) AS open_assignments
    FROM courses c`,
  fields: {
    name: v.text({ max: 120 }),
    code: v.text({ max: 30, nullable: true }),
    term: v.text({ max: 50, nullable: true }),
    instructor: v.text({ max: 100, nullable: true }),
    color: v.color(),
  },
  required: ['name'],
  listConfig: {
    filters: { term: textFilter('c.term') },
    sorts: { name: { expr: 'c.name', dir: 'asc' }, created: { expr: 'c.created_at', dir: 'desc' } },
    defaultSort: 'name',
  },
});
