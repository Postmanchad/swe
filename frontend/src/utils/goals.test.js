import { describe, it, expect } from 'vitest';
import {
  buildGoalQuery,
  formatDateOnly,
  formatMonthKey,
  groupTasksByGoal,
  kindLabel,
  monthKey,
  progressLabel,
  shiftMonthKey,
  targetTone,
} from './goals';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const NOW = d(2026, 11, 5, 14, 0);

describe('buildGoalQuery', () => {
  it('defaults to active goals sorted by target date', () => {
    expect(buildGoalQuery()).toEqual({ sort: 'target', status: 'active' });
  });

  it('adds the kind and drops the status when All is chosen', () => {
    expect(buildGoalQuery({ kind: 'long_term', status: 'all', sort: 'progress' })).toEqual({
      sort: 'progress',
      kind: 'long_term',
    });
  });
});

describe('groupTasksByGoal', () => {
  it('groups tasks by goal and skips standalone tasks', () => {
    const groups = groupTasksByGoal([
      { id: 1, goal_id: 10 },
      { id: 2, goal_id: null },
      { id: 3, goal_id: 10 },
      { id: 4, goal_id: 11 },
    ]);
    expect(groups.get(10).map((t) => t.id)).toEqual([1, 3]);
    expect(groups.get(11).map((t) => t.id)).toEqual([4]);
    expect(groups.size).toBe(2);
  });
});

describe('progressLabel', () => {
  it('describes progress, with correct singular and plural wording', () => {
    expect(progressLabel({ task_total: 0, task_done: 0, progress: 0 })).toBe('No tasks yet');
    expect(progressLabel({ task_total: 1, task_done: 0, progress: 0 })).toBe('0 of 1 task · 0%');
    expect(progressLabel({ task_total: 5, task_done: 3, progress: 60 })).toBe('3 of 5 tasks · 60%');
  });
});

describe('formatDateOnly', () => {
  it('uses Today, Tomorrow and Yesterday for nearby days', () => {
    expect(formatDateOnly('2026-11-05', NOW)).toBe('Today');
    expect(formatDateOnly('2026-11-06', NOW)).toBe('Tomorrow');
    expect(formatDateOnly('2026-11-04', NOW)).toBe('Yesterday');
  });

  it('shows the month and day, plus the year only when it is not this year', () => {
    expect(formatDateOnly('2026-12-15', NOW)).toBe('Dec 15');
    expect(formatDateOnly('2027-05-01', NOW)).toBe('May 1, 2027');
  });

  it('returns an empty string for a missing or invalid date', () => {
    expect(formatDateOnly(null, NOW)).toBe('');
    expect(formatDateOnly('2026-02-30', NOW)).toBe('');
  });
});

describe('targetTone', () => {
  it('is overdue only for active goals whose target date has passed', () => {
    expect(targetTone({ status: 'active', target_date: '2026-11-04' }, NOW)).toBe('overdue');
    expect(targetTone({ status: 'active', target_date: '2026-11-05' }, NOW)).toBe('later');
    expect(targetTone({ status: 'active', target_date: null }, NOW)).toBe('none');
    expect(targetTone({ status: 'completed', target_date: '2026-01-01' }, NOW)).toBe('done');
    expect(targetTone({ status: 'abandoned', target_date: '2026-01-01' }, NOW)).toBe('done');
  });
});

describe('month keys', () => {
  it('builds, shifts and formats YYYY-MM keys', () => {
    expect(monthKey(d(2026, 3, 9))).toBe('2026-03');
    expect(shiftMonthKey('2026-11', 1)).toBe('2026-12');
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
    expect(formatMonthKey('2026-11')).toBe('November 2026');
  });

  it('labels goal kinds', () => {
    expect(kindLabel('short_term')).toBe('Short-term');
    expect(kindLabel('long_term')).toBe('Long-term');
  });
});
