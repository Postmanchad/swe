import { describe, it, expect } from 'vitest';
import { buildAssignmentQuery, dueTone, formatDue, isDone, priorityLabel, statusLabel, withDueDate } from './academic';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const NOW = d(2026, 11, 3, 10, 0);

describe('buildAssignmentQuery', () => {
  it('defaults to open assignments sorted by due date', () => {
    expect(buildAssignmentQuery()).toEqual({ sort: 'due', status: 'todo,in_progress' });
  });

  it('maps the Done and All tabs', () => {
    expect(buildAssignmentQuery({ status: 'done' }).status).toBe('submitted,graded');
    expect('status' in buildAssignmentQuery({ status: 'all' })).toBe(false);
  });

  it('adds the course, priority and sort when chosen', () => {
    expect(buildAssignmentQuery({ courseId: 7, priority: 'high', sort: 'priority' })).toEqual({
      sort: 'priority',
      course_id: 7,
      status: 'todo,in_progress',
      priority: 'high',
    });
  });

  it('leaves out a blank priority and no course', () => {
    const q = buildAssignmentQuery({ courseId: null, priority: '' });
    expect('course_id' in q).toBe(false);
    expect('priority' in q).toBe(false);
  });
});

describe('formatDue', () => {
  it('uses Today, Tomorrow and Yesterday for nearby days', () => {
    expect(formatDue(d(2026, 11, 3, 23, 59), NOW)).toBe('Today, 11:59 PM');
    expect(formatDue(d(2026, 11, 4, 9, 0), NOW)).toBe('Tomorrow, 9 AM');
    expect(formatDue(d(2026, 11, 2, 15, 30), NOW)).toBe('Yesterday, 3:30 PM');
  });

  it('spells out other dates and adds the year only when it differs', () => {
    expect(formatDue(d(2026, 11, 9, 12, 0), NOW)).toBe('Mon, Nov 9, 12 PM');
    expect(formatDue(d(2027, 1, 15, 8, 0), NOW)).toBe('Fri, Jan 15, 2027, 8 AM');
  });
});

describe('dueTone', () => {
  const base = { status: 'todo', overdue: false };

  it('flags overdue work first, then finished work, then today', () => {
    expect(dueTone({ ...base, overdue: true, due: d(2026, 11, 1) }, NOW)).toBe('overdue');
    expect(dueTone({ ...base, status: 'submitted', due: d(2026, 11, 3, 18) }, NOW)).toBe('done');
    expect(dueTone({ ...base, due: d(2026, 11, 3, 18) }, NOW)).toBe('today');
    expect(dueTone({ ...base, due: d(2026, 11, 20) }, NOW)).toBe('later');
  });
});

describe('small helpers', () => {
  it('isDone is true for submitted and graded only', () => {
    expect(['todo', 'in_progress', 'submitted', 'graded'].map(isDone)).toEqual([false, false, true, true]);
  });

  it('labels statuses and priorities', () => {
    expect(statusLabel('in_progress')).toBe('In progress');
    expect(priorityLabel('high')).toBe('High');
  });

  it('withDueDate adds a Date from due_at', () => {
    const a = withDueDate({ id: 1, due_at: d(2026, 11, 5, 9).toISOString() });
    expect(a.due.getTime()).toBe(d(2026, 11, 5, 9).getTime());
  });
});
