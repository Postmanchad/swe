import { describe, it, expect } from 'vitest';
import {
  getVisibleRange,
  getEventsForDay,
  getDaySegment,
  layoutColumns,
  eventDayKeys,
  formatClock,
  toDateInput,
  toTimeInput,
} from './events';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const ev = (id, start, end, extra = {}) => ({ id, title: `e${id}`, start, end, all_day: false, ...extra });

describe('getVisibleRange', () => {
  it('covers one day, one week (Sun-Sat), 42 grid days and a calendar year', () => {
    const date = d(2026, 11, 4);
    const day = getVisibleRange('day', date);
    expect([day.from.getTime(), day.to.getTime()]).toEqual([d(2026, 11, 4).getTime(), d(2026, 11, 5).getTime()]);

    const week = getVisibleRange('week', date);
    expect([week.from.getTime(), week.to.getTime()]).toEqual([d(2026, 11, 1).getTime(), d(2026, 11, 8).getTime()]);

    const month = getVisibleRange('month', date);
    expect(month.from.getTime()).toBe(d(2026, 11, 1).getTime());
    expect(month.to.getTime()).toBe(d(2026, 12, 13).getTime());

    const year = getVisibleRange('year', date);
    expect([year.from.getTime(), year.to.getTime()]).toEqual([d(2026, 1, 1).getTime(), d(2027, 1, 1).getTime()]);
  });

  it('never asks for more than the backend allows (400 days)', () => {
    for (const view of ['day', 'week', 'month', 'year']) {
      const { from, to } = getVisibleRange(view, d(2028, 3, 15));
      expect((to - from) / 86_400_000).toBeLessThan(400);
    }
  });
});

describe('getEventsForDay', () => {
  const events = [
    ev(1, d(2026, 11, 2, 14), d(2026, 11, 2, 15)),
    ev(2, d(2026, 11, 2), d(2026, 11, 3), { all_day: true }),
    ev(3, d(2026, 11, 2, 9), d(2026, 11, 2, 10)),
    ev(4, d(2026, 11, 3, 0), d(2026, 11, 3, 1)),
    ev(5, d(2026, 11, 1, 22), d(2026, 11, 2, 2)),
  ];

  it('returns overlapping events, all-day first, then by start time', () => {
    expect(getEventsForDay(events, d(2026, 11, 2)).map((e) => e.id)).toEqual([2, 5, 3, 1]);
  });

  it('does not include an event that ends exactly at midnight on the next day', () => {
    expect(getEventsForDay(events, d(2026, 11, 3)).map((e) => e.id)).toEqual([4]);
  });
});

describe('getDaySegment', () => {
  it('returns minutes since midnight for a same-day event', () => {
    expect(getDaySegment(ev(1, d(2026, 11, 2, 9, 30), d(2026, 11, 2, 10, 45)), d(2026, 11, 2))).toEqual({
      startMin: 570,
      endMin: 645,
    });
  });

  it('clips an event that spans midnight to each day', () => {
    const overnight = ev(1, d(2026, 11, 2, 22), d(2026, 11, 3, 2));
    expect(getDaySegment(overnight, d(2026, 11, 2))).toEqual({ startMin: 1320, endMin: 1440 });
    expect(getDaySegment(overnight, d(2026, 11, 3))).toEqual({ startMin: 0, endMin: 120 });
  });
});

describe('layoutColumns', () => {
  it('gives a lone event the full width', () => {
    expect(layoutColumns([{ startMin: 60, endMin: 120 }])).toEqual([{ col: 0, cols: 1 }]);
  });

  it('puts overlapping events side by side', () => {
    const r = layoutColumns([
      { startMin: 60, endMin: 180 },
      { startMin: 90, endMin: 150 },
    ]);
    expect(r).toEqual([
      { col: 0, cols: 2 },
      { col: 1, cols: 2 },
    ]);
  });

  it('reuses a column once an earlier event has ended, and keeps separate clusters separate', () => {
    const r = layoutColumns([
      { startMin: 0, endMin: 60 },
      { startMin: 30, endMin: 90 },
      { startMin: 60, endMin: 120 }, // overlaps the 2nd, starts when the 1st ends -> column 0 again
      { startMin: 300, endMin: 360 }, // separate cluster
    ]);
    expect(r[0]).toEqual({ col: 0, cols: 2 });
    expect(r[1]).toEqual({ col: 1, cols: 2 });
    expect(r[2]).toEqual({ col: 0, cols: 2 });
    expect(r[3]).toEqual({ col: 0, cols: 1 });
  });
});

describe('eventDayKeys', () => {
  it('marks every day an event touches', () => {
    const keys = eventDayKeys([
      ev(1, d(2026, 11, 2, 9), d(2026, 11, 2, 10)),
      ev(2, d(2026, 11, 4, 22), d(2026, 11, 5, 1)),
    ]);
    expect([...keys].sort()).toEqual(['2026-11-02', '2026-11-04', '2026-11-05']);
  });
});

describe('formatting helpers', () => {
  it('formatClock drops :00 and uses a 12-hour clock', () => {
    expect([d(2026, 1, 1, 0, 0), d(2026, 1, 1, 9, 30), d(2026, 1, 1, 12, 0), d(2026, 1, 1, 15, 5)].map(formatClock)).toEqual([
      '12 AM',
      '9:30 AM',
      '12 PM',
      '3:05 PM',
    ]);
  });

  it('date and time input formats are zero padded', () => {
    expect(toDateInput(d(2026, 3, 5))).toBe('2026-03-05');
    expect(toTimeInput(d(2026, 3, 5, 7, 4))).toBe('07:04');
  });
});
