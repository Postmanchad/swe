// Builds filtered, sorted, paged list queries from query-string parameters.
import { HttpError, parseId, parseDate, parseMonth } from './fields.js';

const fail = (msg) => {
  throw new HttpError(400, msg);
};

export const priorityRank = (col) => `CASE ${col} WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END`;

// Filter builders: (rawString, addParam) -> SQL condition. Each throws HttpError on bad input.
export const idFilter = (col) => (val, add) => `${col} = ${add(parseId(val))}`;
export const textFilter = (col) => (val, add) => `${col} = ${add(val)}`;
export const monthFilter = (col) => (val, add) => {
  const m = parseMonth(val);
  return m ? `${col} = ${add(m)}` : fail('must be a month like 2026-11');
};
export const inFilter = (col, allowed) => (val, add) => {
  const items = val.split(',').map((s) => s.trim());
  if (!items.every((i) => allowed.includes(i))) fail(`must be one of: ${allowed.join(', ')}`);
  return `${col} = ANY(${add(items)})`;
};
export const timeFilter = (col, op) => (val, add) => {
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? fail('must be an ISO date-time') : `${col} ${op} ${add(d)}`;
};
export const dateFilter = (col, op) => (val, add) => {
  const d = parseDate(val);
  return d ? `${col} ${op} ${add(d)}` : fail('must be a date like 2026-11-30');
};

function clampInt(raw, dflt, min, max) {
  if (raw === undefined) return dflt;
  if (!/^\d+$/.test(String(raw))) fail('must be a whole number');
  return Math.min(max, Math.max(min, Number(raw)));
}

/**
 * config: { alias, select, filters: {param: builder}, sorts: {name: {expr, dir}}, defaultSort }
 * `select` is a SELECT ... FROM ... [JOIN ...] with no WHERE clause.
 * Query params: the filters, plus sort, order (asc|desc), limit (default 200, max 500), offset.
 */
export function buildList(req, { alias, select, filters = {}, sorts, defaultSort }) {
  const params = [req.userId];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const conds = [`${alias}.user_id = $1`];

  for (const [param, build] of Object.entries(filters)) {
    const raw = req.query[param];
    if (raw === undefined) continue;
    try {
      conds.push(build(String(raw), add));
    } catch (e) {
      throw e instanceof HttpError ? new HttpError(400, `${param}: ${e.message}`) : e;
    }
  }

  const sortKey = req.query.sort === undefined ? defaultSort : String(req.query.sort);
  const sort = sorts[sortKey];
  if (!sort) fail(`sort must be one of: ${Object.keys(sorts).join(', ')}`);
  let dir = sort.dir;
  if (req.query.order !== undefined) {
    dir = String(req.query.order).toLowerCase();
    if (dir !== 'asc' && dir !== 'desc') fail('order must be asc or desc');
  }

  let limit;
  let offset;
  try {
    limit = clampInt(req.query.limit, 200, 1, 500);
    offset = clampInt(req.query.offset, 0, 0, 1_000_000_000);
  } catch (e) {
    throw new HttpError(400, `limit/offset ${e.message}`);
  }

  const sql =
    `${select} WHERE ${conds.join(' AND ')} ` +
    `ORDER BY ${sort.expr} ${dir.toUpperCase()} NULLS LAST, ${alias}.id ASC ` +
    `LIMIT ${add(limit)} OFFSET ${add(offset)}`;
  return { sql, params };
}
