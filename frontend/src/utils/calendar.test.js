import { describe, it, expect } from 'vitest';
import {
  HOUR_HEIGHT,
  startOfDay,
  addDays,
  addMonths,
  startOfWeek,
  getWeekDays,
  getMonthGrid,
  getYearMonths,
  shiftDate,
  formatHour,
  getTitle,
  getTimeOffset,
  isSameDay,
} from './calendar';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

describe('calendar utils', () => {
  it('startOfDay clears the time', () => {
    const r = startOfDay(d(2026, 11, 2, 15, 45));
    expect([r.getHours(), r.getMinutes()]).toEqual([0, 0]);
    expect(isSameDay(r, d(2026, 11, 2))).toBe(true);
  });

  it('addDays crosses month and year boundaries', () => {
    expect(isSameDay(addDays(d(2026, 10, 31), 1), d(2026, 11, 1))).toBe(true);
    expect(isSameDay(addDays(d(2026, 12, 31), 1), d(2027, 1, 1))).toBe(true);
    expect(isSameDay(addDays(d(2026, 3, 1), -1), d(2026, 2, 28))).toBe(true);
  });

  it('addMonths clamps to the last day of shorter months', () => {
    expect(isSameDay(addMonths(d(2026, 1, 31), 1), d(2026, 2, 28))).toBe(true);
    expect(isSameDay(addMonths(d(2028, 1, 31), 1), d(2028, 2, 29))).toBe(true);
  });

  it('addMonths moves backward across a year', () => {
    expect(isSameDay(addMonths(d(2026, 1, 15), -1), d(2025, 12, 15))).toBe(true);
  });

  it('startOfWeek respects the chosen first day', () => {
    // Nov 4, 2026 is a Wednesday
    expect(isSameDay(startOfWeek(d(2026, 11, 4), 0), d(2026, 11, 1))).toBe(true);
    expect(isSameDay(startOfWeek(d(2026, 11, 4), 1), d(2026, 11, 2))).toBe(true);
  });

  it('getWeekDays returns 7 consecutive days', () => {
    const days = getWeekDays(d(2026, 11, 4));
    expect(days).toHaveLength(7);
    days.slice(1).forEach((day, i) => {
      expect(isSameDay(day, addDays(days[i], 1))).toBe(true);
    });
  });

  it('getMonthGrid is always 6 weeks and starts on the week start', () => {
    // October 2026 starts on a Thursday, so the grid begins Sep 27
    const grid = getMonthGrid(d(2026, 10, 15));
    expect(grid).toHaveLength(42);
    expect(isSameDay(grid[0], d(2026, 9, 27))).toBe(true);
    expect(grid[0].getDay()).toBe(0);
  });

  it('getMonthGrid contains every day of the month', () => {
    const grid = getMonthGrid(d(2026, 11, 10));
    const inMonth = grid.filter((x) => x.getMonth() === 10);
    expect(inMonth).toHaveLength(30);
  });

  it('getYearMonths returns 12 first-of-month dates', () => {
    const months = getYearMonths(2026);
    expect(months).toHaveLength(12);
    expect(months.every((m, i) => m.getMonth() === i && m.getDate() === 1)).toBe(true);
  });

  it('shiftDate steps by the unit of each view', () => {
    const base = d(2026, 11, 2);
    expect(isSameDay(shiftDate('day', base, 1), d(2026, 11, 3))).toBe(true);
    expect(isSameDay(shiftDate('week', base, -1), d(2026, 10, 26))).toBe(true);
    expect(isSameDay(shiftDate('month', base, 1), d(2026, 12, 2))).toBe(true);
    expect(isSameDay(shiftDate('year', base, 1), d(2027, 11, 2))).toBe(true);
  });

  it('formatHour uses a 12-hour clock', () => {
    expect([0, 1, 11, 12, 13, 23].map(formatHour)).toEqual([
      '12 AM', '1 AM', '11 AM', '12 PM', '1 PM', '11 PM',
    ]);
  });

  it('getTitle handles weeks inside a month, across months and across years', () => {
    expect(getTitle('week', d(2026, 11, 4))).toBe('Nov 1 – 7, 2026');
    expect(getTitle('week', d(2026, 10, 1))).toBe('Sep 27 – Oct 3, 2026');
    expect(getTitle('week', d(2026, 12, 31))).toBe('Dec 27, 2026 – Jan 2, 2027');
    expect(getTitle('month', d(2026, 11, 2))).toBe('November 2026');
    expect(getTitle('year', d(2026, 11, 2))).toBe('2026');
    expect(getTitle('day', d(2026, 11, 2))).toBe('Monday, November 2, 2026');
  });

  it('getTimeOffset maps time to pixels at 48px per hour', () => {
    expect(getTimeOffset(d(2026, 11, 2, 0, 0))).toBe(0);
    expect(getTimeOffset(d(2026, 11, 2, 1, 30))).toBe(1.5 * HOUR_HEIGHT);
    expect(getTimeOffset(d(2026, 11, 2, 23, 59))).toBeLessThan(24 * HOUR_HEIGHT);
  });
});
