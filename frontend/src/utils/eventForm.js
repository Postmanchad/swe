// Converts between the backend's event fields and the plain values the event form edits.
// Everything the user types is local time; the API gets ISO timestamps.

import { addDays } from './calendar';
import { DEFAULT_COLOR, toDateInput, toTimeInput } from './events';

export function parseLocalDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str ?? '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
}

export function combineLocal(dateStr, timeStr) {
  const day = parseLocalDate(dateStr);
  const m = /^(\d{2}):(\d{2})$/.exec(timeStr ?? '');
  if (!day || !m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 23 || min > 59) return null;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min);
}

// A blank form for a new event starting at `start` and lasting an hour (or until 11:59 PM).
export function formFromSlot(start) {
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = Math.min(startMin + 60, 1439);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, endMin);
  return {
    title: '',
    date: toDateInput(start),
    allDay: false,
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    color: DEFAULT_COLOR,
    repeatDays: [],
    repeatUntil: '',
    notes: '',
  };
}

// A form filled from a stored event (the row from GET /events/:id, not an expanded occurrence).
export function formFromEvent(ev) {
  const start = new Date(ev.start_time);
  const end = new Date(ev.end_time);
  return {
    title: ev.title ?? '',
    date: toDateInput(start),
    allDay: Boolean(ev.all_day),
    startTime: ev.all_day ? '09:00' : toTimeInput(start),
    endTime: ev.all_day ? '10:00' : toTimeInput(end),
    color: ev.color ?? DEFAULT_COLOR,
    repeatDays: ev.recurrence_days ?? [],
    repeatUntil: ev.recurrence_until ? toDateInput(new Date(ev.recurrence_until)) : '',
    notes: ev.notes ?? '',
  };
}

// Returns { payload } ready to send to the API, or { error } with a message to show the user.
export function payloadFromForm(form) {
  const title = form.title.trim();
  if (!title) return { error: 'Give the event a title.' };

  const day = parseLocalDate(form.date);
  if (!day) return { error: 'Pick a date.' };

  let start;
  let end;
  if (form.allDay) {
    start = day;
    end = addDays(day, 1);
  } else {
    start = combineLocal(form.date, form.startTime);
    end = combineLocal(form.date, form.endTime);
    if (!start || !end) return { error: 'Enter a start and end time.' };
    if (end <= start) return { error: 'The end time must be after the start time.' };
  }

  const days = [...new Set(form.repeatDays)].sort((a, b) => a - b);

  let until = null;
  if (days.length && form.repeatUntil) {
    const u = parseLocalDate(form.repeatUntil);
    if (!u) return { error: 'Pick a valid “repeat until” date.' };
    until = new Date(u.getFullYear(), u.getMonth(), u.getDate(), 23, 59, 59);
    if (until < start) return { error: '“Repeat until” must be on or after the first date.' };
  }

  return {
    payload: {
      title,
      notes: form.notes,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      all_day: form.allDay,
      color: form.color,
      recurrence_days: days.length ? days : null,
      recurrence_until: until ? until.toISOString() : null,
    },
  };
}
