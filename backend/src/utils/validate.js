import { isValidTimeZone } from './recurrence.js';

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Validates a full event object (after merging any PATCH body over the existing row).
 * Returns { value } on success or { error } on failure.
 */
export function validateEvent(src) {
  const title = typeof src.title === 'string' ? src.title.trim() : '';
  if (!title || title.length > 200) return { error: 'title is required (max 200 characters)' };

  const notes = src.notes ?? '';
  if (typeof notes !== 'string' || notes.length > 10_000) return { error: 'notes must be a string (max 10000 characters)' };

  const start = new Date(src.start_time);
  const end = new Date(src.end_time);
  if (Number.isNaN(start.getTime())) return { error: 'start_time must be a valid date-time' };
  if (Number.isNaN(end.getTime())) return { error: 'end_time must be a valid date-time' };
  if (end <= start) return { error: 'end_time must be after start_time' };

  const allDay = src.all_day ?? false;
  if (typeof allDay !== 'boolean') return { error: 'all_day must be true or false' };

  const color = src.color ?? null;
  if (color !== null && !COLOR_RE.test(color)) return { error: 'color must be a hex value like #3b82f6' };

  let days = src.recurrence_days ?? null;
  if (days !== null) {
    if (!Array.isArray(days) || !days.every((n) => Number.isInteger(n) && n >= 0 && n <= 6)) {
      return { error: 'recurrence_days must be an array of integers 0 (Sunday) to 6 (Saturday)' };
    }
    days = [...new Set(days)].sort();
    if (days.length === 0) days = null;
  }

  let until = src.recurrence_until ?? null;
  if (until !== null) {
    until = new Date(until);
    if (Number.isNaN(until.getTime())) return { error: 'recurrence_until must be a valid date-time' };
    if (days === null) return { error: 'recurrence_until requires recurrence_days' };
    if (until < start) return { error: 'recurrence_until must not be before start_time' };
  }

  const tz = src.tz ?? 'UTC';
  if (typeof tz !== 'string' || !isValidTimeZone(tz)) return { error: 'tz must be a valid IANA time zone, e.g. America/New_York' };

  return { value: { title, notes, start_time: start, end_time: end, all_day: allDay, color, recurrence_days: days, recurrence_until: until, tz } };
}
