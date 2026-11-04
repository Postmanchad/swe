// Expands stored events into the occurrences that fall inside a date range.
// Recurring events repeat on weekdays (0 = Sunday ... 6 = Saturday) at the same
// wall-clock time in the event's own time zone, so a 10:00 class stays at 10:00
// across daylight-saving changes.

const DAY_MS = 86_400_000;
export const MAX_OCCURRENCES = 2000;

const formatters = new Map();
function formatter(tz) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz) {
  try {
    formatter(tz);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock parts of an instant in a time zone. */
export function localParts(date, tz) {
  const p = {};
  for (const { type, value } of formatter(tz).formatToParts(date)) {
    if (type !== 'literal') p[type] = Number(value);
  }
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
}

function offsetMs(utcMs, tz) {
  const p = localParts(new Date(utcMs), tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** The instant at which the wall clock in `tz` reads the given date and time. */
export function zonedToUtc(year, month, day, hour, minute, tz) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let utc = guess - offsetMs(guess, tz);
  utc = guess - offsetMs(utc, tz); // second pass handles offsets that change near the guess
  return new Date(utc);
}

function toPublic(ev, start, end, recurring) {
  return {
    id: ev.id,
    title: ev.title,
    notes: ev.notes,
    start_time: start,
    end_time: end,
    all_day: ev.all_day,
    color: ev.color,
    recurring,
    recurrence_days: ev.recurrence_days,
    recurrence_until: ev.recurrence_until,
    tz: ev.tz,
  };
}

/** Occurrences of one stored event that overlap [from, to). */
export function expandEvent(ev, from, to) {
  const start = new Date(ev.start_time);
  const end = new Date(ev.end_time);
  const days = ev.recurrence_days;

  if (!days || days.length === 0) {
    return start < to && end > from ? [toPublic(ev, start, end, false)] : [];
  }

  const tz = ev.tz || 'UTC';
  const duration = end - start;
  const s = localParts(start, tz);
  const seriesStartDay = Date.UTC(s.year, s.month - 1, s.day);
  const until = ev.recurrence_until ? new Date(ev.recurrence_until) : null;

  // Scan calendar days (as abstract UTC days) from just before `from` to just after `to`.
  const lo = localParts(new Date(from.getTime() - duration - DAY_MS), tz);
  const hi = localParts(new Date(to.getTime() + DAY_MS), tz);
  let day = Math.max(seriesStartDay, Date.UTC(lo.year, lo.month - 1, lo.day));
  const lastDay = Date.UTC(hi.year, hi.month - 1, hi.day);

  const out = [];
  for (; day <= lastDay && out.length < MAX_OCCURRENCES; day += DAY_MS) {
    const d = new Date(day);
    if (!days.includes(d.getUTCDay())) continue;
    const occStart = zonedToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), s.hour, s.minute, tz);
    if (until && occStart > until) break;
    const occEnd = new Date(occStart.getTime() + duration);
    if (occStart < to && occEnd > from) out.push(toPublic(ev, occStart, occEnd, true));
  }
  return out;
}
