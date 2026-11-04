import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../utils/wrap.js';
import { validateEvent } from '../utils/validate.js';
import { expandEvent } from '../utils/recurrence.js';

const router = Router();
router.use(requireAuth);

const MAX_RANGE_DAYS = 400; // enough for a year view
const COLUMNS = 'id, title, notes, start_time, end_time, all_day, color, recurrence_days, recurrence_until, tz';

const parseId = (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    res.status(400).json({ error: 'Invalid event id' });
    return null;
  }
  return Number(req.params.id);
};

// GET /events?from=<ISO>&to=<ISO>  ->  occurrences overlapping [from, to), recurring ones expanded
router.get('/', wrap(async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return res.status(400).json({ error: 'from and to are required ISO date-times' });
  }
  if (to <= from) return res.status(400).json({ error: 'to must be after from' });
  if ((to - from) / 86_400_000 > MAX_RANGE_DAYS) {
    return res.status(400).json({ error: `Range may not exceed ${MAX_RANGE_DAYS} days` });
  }

  // Candidates: anything starting before the range ends that could still reach into it.
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM events
     WHERE user_id = $1 AND start_time < $3
       AND (
         (recurrence_days IS NULL AND end_time > $2)
         OR (recurrence_days IS NOT NULL AND (recurrence_until IS NULL OR recurrence_until >= $2::timestamptz - interval '1 day'))
       )`,
    [req.userId, from, to],
  );

  const events = rows
    .flatMap((r) => expandEvent(r, from, to))
    .sort((a, b) => a.start_time - b.start_time || a.id - b.id);
  res.json({ events });
}));

// GET /events/:id  ->  the stored event or series (not expanded)
router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { rows } = await query(`SELECT ${COLUMNS} FROM events WHERE id = $1 AND user_id = $2`, [id, req.userId]);
  if (!rows[0]) return res.status(404).json({ error: 'Event not found' });
  res.json({ event: rows[0] });
}));

router.post('/', wrap(async (req, res) => {
  const { value, error } = validateEvent(req.body ?? {});
  if (error) return res.status(400).json({ error });
  const { rows } = await query(
    `INSERT INTO events (user_id, title, notes, start_time, end_time, all_day, color, recurrence_days, recurrence_until, tz)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${COLUMNS}`,
    [req.userId, value.title, value.notes, value.start_time, value.end_time, value.all_day, value.color, value.recurrence_days, value.recurrence_until, value.tz],
  );
  res.status(201).json({ event: rows[0] });
}));

// PATCH /events/:id  ->  partial update; send only the fields you want to change
// (use "notes" for the inline notes section; send "recurrence_days": null to stop repeating)
router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const existing = await query(`SELECT ${COLUMNS} FROM events WHERE id = $1 AND user_id = $2`, [id, req.userId]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Event not found' });

  const { value, error } = validateEvent({ ...existing.rows[0], ...(req.body ?? {}) });
  if (error) return res.status(400).json({ error });

  const { rows } = await query(
    `UPDATE events SET title=$3, notes=$4, start_time=$5, end_time=$6, all_day=$7, color=$8,
            recurrence_days=$9, recurrence_until=$10, tz=$11, updated_at=now()
     WHERE id=$1 AND user_id=$2 RETURNING ${COLUMNS}`,
    [id, req.userId, value.title, value.notes, value.start_time, value.end_time, value.all_day, value.color, value.recurrence_days, value.recurrence_until, value.tz],
  );
  res.json({ event: rows[0] });
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { rowCount } = await query('DELETE FROM events WHERE id = $1 AND user_id = $2', [id, req.userId]);
  if (!rowCount) return res.status(404).json({ error: 'Event not found' });
  res.status(204).end();
}));

export default router;
