// Labels, filters and display helpers for courses and assignments.

import { MONTH_SHORT, WEEKDAY_SHORT, startOfDay } from './calendar';
import { formatClock } from './events';

export const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded', label: 'Graded' },
];

export const SORTS = [
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'course', label: 'Course' },
  { value: 'status', label: 'Status' },
];

export const STATUS_FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
];

export const PRIORITY_DOT = { high: '#d6455d', medium: '#c97a06', low: '#7d8aa6' };

export const isDone = (status) => status === 'submitted' || status === 'graded';
export const statusLabel = (value) => STATUSES.find((s) => s.value === value)?.label ?? value;
export const priorityLabel = (value) => PRIORITIES.find((p) => p.value === value)?.label ?? value;

// Turns the filter bar's state into GET /assignments query parameters.
export function buildAssignmentQuery({ courseId = null, status = 'open', priority = '', sort = 'due' } = {}) {
  const query = { sort };
  if (courseId) query.course_id = courseId;
  if (status === 'open') query.status = 'todo,in_progress';
  else if (status === 'done') query.status = 'submitted,graded';
  if (priority) query.priority = priority;
  return query;
}

// API rows carry due_at as a string; add a Date for display.
export const withDueDate = (a) => ({ ...a, due: new Date(a.due_at) });

const dayDiff = (due, now) => Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000);

export function formatDue(due, now = new Date()) {
  const time = formatClock(due);
  const diff = dayDiff(due, now);
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Tomorrow, ${time}`;
  if (diff === -1) return `Yesterday, ${time}`;
  const date = `${WEEKDAY_SHORT[due.getDay()]}, ${MONTH_SHORT[due.getMonth()]} ${due.getDate()}`;
  const year = due.getFullYear() !== now.getFullYear() ? `, ${due.getFullYear()}` : '';
  return `${date}${year}, ${time}`;
}

// How urgent an assignment looks: 'overdue' | 'done' | 'today' | 'later'
export function dueTone(assignment, now = new Date()) {
  if (assignment.overdue) return 'overdue';
  if (isDone(assignment.status)) return 'done';
  return dayDiff(assignment.due, now) === 0 ? 'today' : 'later';
}
