import { crudRouter } from '../utils/crud.js';
import { v } from '../utils/fields.js';
import { monthFilter } from '../utils/listing.js';

// Monthly intentions: short statements the user sets for a month, e.g. { month: "2026-11", body: "Sleep before midnight" }.
export default crudRouter({
  table: 'intentions',
  alias: 'i',
  names: ['intention', 'intentions'],
  select: 'SELECT i.id, i.month, i.body, i.done, i.created_at, i.updated_at FROM intentions i',
  fields: {
    month: v.month(),
    body: v.text({ max: 500 }),
    done: v.bool(),
  },
  required: ['month', 'body'],
  listConfig: {
    filters: { month: monthFilter('i.month') },
    sorts: { created: { expr: 'i.created_at', dir: 'asc' }, month: { expr: 'i.month', dir: 'desc' } },
    defaultSort: 'created',
  },
});
