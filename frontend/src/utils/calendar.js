// Pure date helpers for the calendar views. All dates are local-time Date objects.

export const HOUR_HEIGHT = 48; // px per hour in the Day and Week grids
export const VIEWS = ['day', 'week', 'month', 'year'];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));
export const WEEKDAY_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
export const WEEKDAY_SHORT = WEEKDAY_LONG.map((d) => d.slice(0, 3));

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// Moves by whole months and clamps the day (Jan 31 + 1 month = Feb 28/29).
export function addMonths(d, n) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const day = Math.min(d.getDate(), daysInMonth(target));
  return new Date(target.getFullYear(), target.getMonth(), day);
}

export function addYears(d, n) {
  return addMonths(d, n * 12);
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// weekStartsOn: 0 = Sunday, 1 = Monday, ...
export function startOfWeek(d, weekStartsOn = 0) {
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  return addDays(startOfDay(d), -diff);
}

export function getWeekDays(d, weekStartsOn = 0) {
  const start = startOfWeek(d, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Always 42 days (6 weeks) so the grid height never jumps between months.
export function getMonthGrid(d, weekStartsOn = 0) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function getYearMonths(year) {
  return Array.from({ length: 12 }, (_, m) => new Date(year, m, 1));
}

// direction: -1 (previous) or 1 (next)
export function shiftDate(view, d, direction) {
  switch (view) {
    case 'day':
      return addDays(d, direction);
    case 'week':
      return addDays(d, 7 * direction);
    case 'month':
      return addMonths(d, direction);
    case 'year':
      return addYears(d, direction);
    default:
      return d;
  }
}

export function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export function getTitle(view, d, weekStartsOn = 0) {
  const month = MONTH_NAMES[d.getMonth()];
  switch (view) {
    case 'year':
      return String(d.getFullYear());
    case 'month':
      return `${month} ${d.getFullYear()}`;
    case 'week': {
      const days = getWeekDays(d, weekStartsOn);
      const a = days[0];
      const b = days[6];
      const ma = MONTH_SHORT[a.getMonth()];
      const mb = MONTH_SHORT[b.getMonth()];
      if (a.getFullYear() !== b.getFullYear()) {
        return `${ma} ${a.getDate()}, ${a.getFullYear()} – ${mb} ${b.getDate()}, ${b.getFullYear()}`;
      }
      if (a.getMonth() !== b.getMonth()) {
        return `${ma} ${a.getDate()} – ${mb} ${b.getDate()}, ${b.getFullYear()}`;
      }
      return `${ma} ${a.getDate()} – ${b.getDate()}, ${b.getFullYear()}`;
    }
    default:
      return `${WEEKDAY_LONG[d.getDay()]}, ${month} ${d.getDate()}, ${d.getFullYear()}`;
  }
}

// Vertical position (px) of a time of day inside the 24-hour grid.
export function getTimeOffset(d) {
  return ((d.getHours() * 60 + d.getMinutes()) / 60) * HOUR_HEIGHT;
}

export function describeDate(d) {
  return `${WEEKDAY_LONG[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
