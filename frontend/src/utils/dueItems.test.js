import { describe, it, expect } from 'vitest';
import { assignmentToItem } from './dueItems';
import { eventDayKeys, getDaySegment, getEventsForDay, layoutColumns } from './events';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

const assignment = (extra = {}) => ({
  id: 5,
  title: 'hw 1',
  course_name: 'cosc 420',
  course_color: '#0f8b7d',
  status: 'todo',
  overdue: false,
  due: d(2026, 11, 14, 23, 59),
  ...extra,
});

describe('assignmentToItem', () => {
  it('maps an assignment to a calendar item with a single moment in time', () => {
    const item = assignmentToItem(assignment());
    expect(item.kind).toBe('assignment');
    expect(item.id).toBe('assignment-5');
    expect(item.title).toBe('hw 1');
    expect(item.courseName).toBe('cosc 420');
    expect(item.color).toBe('#0f8b7d');
    expect(item.start.getTime()).toBe(item.end.getTime());
    expect(item.start.getTime()).toBe(d(2026, 11, 14, 23, 59).getTime());
    expect(item.all_day).toBe(false);
  });

  it('marks submitted and graded work as done, and passes the overdue flag through', () => {
    expect(assignmentToItem(assignment()).done).toBe(false);
    expect(assignmentToItem(assignment({ status: 'submitted' })).done).toBe(true);
    expect(assignmentToItem(assignment({ status: 'graded' })).done).toBe(true);
    expect(assignmentToItem(assignment({ overdue: true })).overdue).toBe(true);
  });

  it('falls back to the default color and keeps the full record for editing', () => {
    const a = assignment({ course_color: null });
    const item = assignmentToItem(a);
    expect(item.color).toBe('#3a5bdb');
    expect(item.assignment).toBe(a);
  });
});

describe('assignments in getEventsForDay', () => {
  const items = [
    assignmentToItem(assignment({ id: 1, due: d(2026, 11, 14, 23, 59) })),
    assignmentToItem(assignment({ id: 2, due: d(2026, 11, 15, 0, 0) })), // exactly midnight belongs to the 15th
    assignmentToItem(assignment({ id: 3, due: d(2026, 11, 14, 9, 0) })),
  ];

  it('shows an assignment only on the day it is due, in time order', () => {
    expect(getEventsForDay(items, d(2026, 11, 14)).map((e) => e.assignment.id)).toEqual([3, 1]);
    expect(getEventsForDay(items, d(2026, 11, 15)).map((e) => e.assignment.id)).toEqual([2]);
    expect(getEventsForDay(items, d(2026, 11, 13))).toHaveLength(0);
  });

  it('sits alongside normal events on the same day', () => {
    const event = { id: 9, title: 'Lecture', start: d(2026, 11, 14, 10), end: d(2026, 11, 14, 11), all_day: false };
    const ids = getEventsForDay([...items, event], d(2026, 11, 14)).map((e) => e.id);
    expect(ids).toEqual(['assignment-3', 9, 'assignment-1']);
  });
});

describe('assignments in getDaySegment', () => {
  it('draws a 30-minute block that ends at the due time', () => {
    expect(getDaySegment(assignmentToItem(assignment({ due: d(2026, 11, 14, 14, 0) })), d(2026, 11, 14))).toEqual({
      startMin: 810,
      endMin: 840,
    });
  });

  it('keeps an 11:59 PM due time inside the day', () => {
    const seg = getDaySegment(assignmentToItem(assignment()), d(2026, 11, 14));
    expect(seg).toEqual({ startMin: 1409, endMin: 1439 });
  });

  it('never starts before midnight', () => {
    const seg = getDaySegment(assignmentToItem(assignment({ due: d(2026, 11, 14, 0, 10) })), d(2026, 11, 14));
    expect(seg).toEqual({ startMin: 0, endMin: 30 });
  });

  it('places two assignments due close together side by side', () => {
    const a = getDaySegment(assignmentToItem(assignment({ due: d(2026, 11, 14, 12, 0) })), d(2026, 11, 14));
    const b = getDaySegment(assignmentToItem(assignment({ due: d(2026, 11, 14, 12, 15) })), d(2026, 11, 14));
    const layout = layoutColumns([a, b]);
    expect(layout.map((l) => l.cols)).toEqual([2, 2]);
  });
});

describe('assignments in eventDayKeys', () => {
  it('marks the due day for the year view dots', () => {
    const keys = eventDayKeys([assignmentToItem(assignment()), assignmentToItem(assignment({ due: d(2026, 12, 1, 8) }))]);
    expect([...keys].sort()).toEqual(['2026-11-14', '2026-12-01']);
  });
});
