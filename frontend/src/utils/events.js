// Helpers for showing events on the calendar. Events here are the objects returned by
// api/client.js `events.list()`: { id, title, notes, start, end, all_day, color, recurring, ... }
// where `start` and `end` are Date objects.

import { addDays, getMonthGrid, startOfDay, startOfWeek } from './calendar';

export const DEFAULT_COLOR = '#3a5bdb';
export const EVENT_COLORS = [
  { name: 'Blue', value: '#3a5bdb' },
  { name: 'Teal', value: '#0f8b7d' },
  { name: 'Amber', value: '#c97a06' },
  { name: 'Rose', value: '#d6455d' },
  { name: 'Violet', value: '#7352d9' },
  { name: 'Slate', value: '#4b5a78' },
];

const pad = (n) => String(n).padStart(2, '0');
const DUE_BLOCK_MINUTES = 30; // an assignment's due time is drawn as a short block ending at that time

// The date range each view needs to fetch: { from, to } with `to` exclusive.
// Every range stays under the backend's 400-day limit.
export function getVisibleRange(view, date, weekStartsOn = 0) {
  switch (view) {
    case 'day': {
      const from = startOfDay(date);
      return { from, to: addDays(from, 1) };
    }
    case 'week': {
      const from = startOfWeek(date, weekStartsOn);
      return { from, to: addDays(from, 7) };
    }
    case 'year':
      return { from: new Date(date.getFullYear(), 0, 1), to: new Date(date.getFullYear() + 1, 0, 1) };
    default: {
      const from = getMonthGrid(date, weekStartsOn)[0];
      return { from, to: addDays(from, 42) };
    }
  }
}

// Events that overlap a calendar day: all-day first, then by start time.
export function getEventsForDay(events, day) {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  return events
    .filter((e) =>
      // An assignment is due at one moment, so it belongs to the day that moment falls on.
      e.kind === 'assignment' ? e.start >= dayStart && e.start < dayEnd : e.start < dayEnd && e.end > dayStart,
    )
    .sort((a, b) => Number(b.all_day) - Number(a.all_day) || a.start - b.start);
}

// Minutes since local midnight where the event starts and ends on this day (clipped to the day).
export function getDaySegment(event, day) {
  if (event.kind === 'assignment') {
    const dueMin = event.start.getHours() * 60 + event.start.getMinutes();
    return { startMin: Math.max(0, dueMin - DUE_BLOCK_MINUTES), endMin: Math.max(dueMin, DUE_BLOCK_MINUTES) };
  }
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const s = event.start < dayStart ? dayStart : event.start;
  const startMin = s.getHours() * 60 + s.getMinutes();
  const endMin = event.end >= dayEnd ? 1440 : event.end.getHours() * 60 + event.end.getMinutes();
  return { startMin, endMin };
}

// Places overlapping segments side by side. Returns [{ col, cols }] in the same order as the input.
export function layoutColumns(segments) {
  const order = segments
    .map((_, i) => i)
    .sort((a, b) => segments[a].startMin - segments[b].startMin || segments[b].endMin - segments[a].endMin);
  const result = new Array(segments.length);
  let cluster = [];
  let clusterEnd = -1;
  let colEnds = [];

  const flush = () => {
    for (const i of cluster) result[i].cols = colEnds.length;
    cluster = [];
    colEnds = [];
    clusterEnd = -1;
  };

  for (const i of order) {
    const seg = segments[i];
    if (cluster.length && seg.startMin >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= seg.startMin);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(seg.endMin);
    } else {
      colEnds[col] = seg.endMin;
    }
    result[i] = { col, cols: 1 };
    cluster.push(i);
    clusterEnd = Math.max(clusterEnd, seg.endMin);
  }
  flush();
  return result;
}

export function toDateInput(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeInput(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Set of 'YYYY-MM-DD' strings for every day that has at least one event (used for dots in the year view).
export function eventDayKeys(events) {
  const keys = new Set();
  for (const e of events) {
    if (e.kind === 'assignment') {
      keys.add(toDateInput(e.start));
      continue;
    }
    for (let d = startOfDay(e.start); d < e.end; d = addDays(d, 1)) keys.add(toDateInput(d));
  }
  return keys;
}

export function formatClock(d) {
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes();
  return `${h}${m ? `:${pad(m)}` : ''} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}
