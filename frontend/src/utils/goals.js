// Labels, filters and display helpers for goals, tasks and monthly intentions.
// Goal target dates, task due dates and intention months come from the API as plain 'YYYY-MM-DD' strings.

import { MONTH_NAMES, MONTH_SHORT, startOfDay } from './calendar';
import { parseLocalDate } from './eventForm';
import { toDateInput } from './events';

export const KINDS = [
  { value: 'short_term', label: 'Short-term' },
  { value: 'long_term', label: 'Long-term' },
];
export const KIND_FILTERS = [{ value: 'all', label: 'All' }, ...KINDS];

export const GOAL_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];
export const GOAL_STATUS_FILTERS = [...GOAL_STATUSES, { value: 'all', label: 'All' }];

export const GOAL_SORTS = [
  { value: 'target', label: 'Target date' },
  { value: 'priority', label: 'Priority' },
  { value: 'progress', label: 'Progress' },
  { value: 'created', label: 'Newest' },
];

export const TASK_STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export const kindLabel = (value) => KINDS.find((k) => k.value === value)?.label ?? value;
export const goalStatusLabel = (value) => GOAL_STATUSES.find((s) => s.value === value)?.label ?? value;
export const taskStatusLabel = (value) => TASK_STATUSES.find((s) => s.value === value)?.label ?? value;

// Turns the filter bar's state into GET /goals query parameters.
export function buildGoalQuery({ kind = 'all', status = 'active', sort = 'target' } = {}) {
  const query = { sort };
  if (kind !== 'all') query.kind = kind;
  if (status !== 'all') query.status = status;
  return query;
}

// Tasks that belong to a goal, grouped by goal id. Standalone tasks (no goal) are left out.
export function groupTasksByGoal(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    if (task.goal_id == null) continue;
    if (!groups.has(task.goal_id)) groups.set(task.goal_id, []);
    groups.get(task.goal_id).push(task);
  }
  return groups;
}

export function progressLabel(goal) {
  if (!goal.task_total) return 'No tasks yet';
  const noun = goal.task_total === 1 ? 'task' : 'tasks';
  return `${goal.task_done} of ${goal.task_total} ${noun} · ${goal.progress}%`;
}

// 'YYYY-MM-DD' -> "Today", "Tomorrow", "Dec 15" (the year is added only when it is not this year).
export function formatDateOnly(str, now = new Date()) {
  const day = parseLocalDate(str);
  if (!day) return '';
  const diff = Math.round((day - startOfDay(now)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const year = day.getFullYear() !== now.getFullYear() ? `, ${day.getFullYear()}` : '';
  return `${MONTH_SHORT[day.getMonth()]} ${day.getDate()}${year}`;
}

// How a target date should look: 'overdue' (past and still active), 'done' (not active), 'none' or 'later'.
export function targetTone(goal, now = new Date()) {
  if (goal.status !== 'active') return 'done';
  if (!goal.target_date) return 'none';
  return goal.target_date < toDateInput(now) ? 'overdue' : 'later';
}

// ---- months, as 'YYYY-MM' keys ----

export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function shiftMonthKey(key, n) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
}

export function formatMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}
