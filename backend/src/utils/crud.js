// Builds the standard routes for one resource: list, get, create, partial update, delete.
// Column names come from the `fields` spec (never from user input), so they are safe to interpolate.
import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from './wrap.js';
import { HttpError, parseId, validateBody } from './fields.js';
import { buildList } from './listing.js';

/** Throws 400 unless row `id` of `table` belongs to the user. */
export async function assertOwned(table, id, userId, label) {
  const { rowCount } = await query(`SELECT 1 FROM ${table} WHERE id = $1 AND user_id = $2`, [id, userId]);
  if (!rowCount) throw new HttpError(400, `${label} does not exist`);
}

/**
 * options:
 *   table, alias   - table name and the alias used in `select`
 *   select         - SELECT ... FROM ... (no WHERE); used for reads so joins/computed columns are included
 *   names          - [singular, plural] used as response keys
 *   fields         - field name -> validator
 *   required       - fields required on create
 *   listConfig     - filters / sorts / defaultSort for GET /
 *   prepare        - optional async (values, existing, userId); may adjust values or throw HttpError
 */
export function crudRouter({ table, alias, select, names, fields, required, listConfig, prepare }) {
  const [one, many] = names;
  const router = Router();
  router.use(requireAuth);

  const fetchOne = async (id, userId) =>
    (await query(`${select} WHERE ${alias}.id = $1 AND ${alias}.user_id = $2`, [id, userId])).rows[0];

  router.get('/', wrap(async (req, res) => {
    const { sql, params } = buildList(req, { alias, select, ...listConfig });
    const { rows } = await query(sql, params);
    res.json({ [many]: rows });
  }));

  router.get('/:id', wrap(async (req, res) => {
    const row = await fetchOne(parseId(req.params.id), req.userId);
    if (!row) throw new HttpError(404, 'Not found');
    res.json({ [one]: row });
  }));

  router.post('/', wrap(async (req, res) => {
    const values = validateBody(fields, req.body ?? {}, { required });
    if (prepare) await prepare(values, null, req.userId);
    const cols = Object.keys(values);
    const { rows } = await query(
      `INSERT INTO ${table} (user_id, ${cols.join(', ')}) VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING id`,
      [req.userId, ...cols.map((c) => values[c])],
    );
    res.status(201).json({ [one]: await fetchOne(rows[0].id, req.userId) });
  }));

  router.patch('/:id', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = (await query(`SELECT * FROM ${table} WHERE id = $1 AND user_id = $2`, [id, req.userId])).rows[0];
    if (!existing) throw new HttpError(404, 'Not found');

    const values = validateBody(fields, req.body ?? {}, { partial: true });
    if (prepare) await prepare(values, existing, req.userId);
    const cols = Object.keys(values);
    if (cols.length > 0) {
      await query(
        `UPDATE ${table} SET ${cols.map((c, i) => `${c} = $${i + 3}`).join(', ')}, updated_at = now() WHERE id = $1 AND user_id = $2`,
        [id, req.userId, ...cols.map((c) => values[c])],
      );
    }
    res.json({ [one]: await fetchOne(id, req.userId) });
  }));

  router.delete('/:id', wrap(async (req, res) => {
    const { rowCount } = await query(`DELETE FROM ${table} WHERE id = $1 AND user_id = $2`, [parseId(req.params.id), req.userId]);
    if (!rowCount) throw new HttpError(404, 'Not found');
    res.status(204).end();
  }));

  return router;
}
