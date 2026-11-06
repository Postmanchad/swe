// Converts between goal / task / intention records and the values the forms edit.

import { PRIORITIES } from './academic';
import { parseLocalDate } from './eventForm';
import { GOAL_STATUSES, KINDS, TASK_STATUSES } from './goals';

const isOption = (list, value) => list.some((o) => o.value === value);
const dateOnly = (value) => (value ? String(value).slice(0, 10) : '');

// Checks an optional 'YYYY-MM-DD' field; returns { value } (a string or null) or { error }.
function optionalDate(str, label) {
  if (!str) return { value: null };
  return parseLocalDate(str) ? { value: str } : { error: `Pick a valid ${label}.` };
}

// ---- goals ----

export const blankGoalForm = (kind = 'short_term') => ({
  title: '',
  description: '',
  kind,
  category: '',
  priority: 'medium',
  status: 'active',
  targetDate: '',
});

export const goalFormFrom = (goal) => ({
  title: goal.title ?? '',
  description: goal.description ?? '',
  kind: goal.kind,
  category: goal.category ?? '',
  priority: goal.priority,
  status: goal.status,
  targetDate: dateOnly(goal.target_date),
});

export function goalPayloadFromForm(form) {
  const title = form.title.trim();
  if (!title) return { error: 'Give the goal a title.' };
  if (title.length > 200) return { error: 'The title is too long (200 characters max).' };
  if (form.description.length > 5000) return { error: 'The description is too long (5,000 characters max).' };
  const category = form.category.trim();
  if (category.length > 50) return { error: 'The category is too long (50 characters max).' };
  if (!isOption(KINDS, form.kind)) return { error: 'Choose short-term or long-term.' };
  if (!isOption(PRIORITIES, form.priority)) return { error: 'Choose a priority.' };
  if (!isOption(GOAL_STATUSES, form.status)) return { error: 'Choose a status.' };
  const target = optionalDate(form.targetDate, 'target date');
  if (target.error) return { error: target.error };

  return {
    payload: {
      title,
      description: form.description,
      kind: form.kind,
      category: category || null,
      priority: form.priority,
      status: form.status,
      target_date: target.value,
    },
  };
}

// ---- tasks ----

export const blankTaskForm = (goalId = null) => ({
  title: '',
  goalId: goalId ? String(goalId) : '',
  category: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  notes: '',
});

export const taskFormFrom = (task) => ({
  title: task.title ?? '',
  goalId: task.goal_id ? String(task.goal_id) : '',
  category: task.category ?? '',
  priority: task.priority,
  status: task.status,
  dueDate: dateOnly(task.due_date),
  notes: task.notes ?? '',
});

export function taskPayloadFromForm(form) {
  const title = form.title.trim();
  if (!title) return { error: 'Give the task a title.' };
  if (title.length > 200) return { error: 'The title is too long (200 characters max).' };
  if (form.notes.length > 10_000) return { error: 'The notes are too long (10,000 characters max).' };
  const category = form.category.trim();
  if (category.length > 50) return { error: 'The category is too long (50 characters max).' };
  if (!isOption(PRIORITIES, form.priority)) return { error: 'Choose a priority.' };
  if (!isOption(TASK_STATUSES, form.status)) return { error: 'Choose a status.' };
  const due = optionalDate(form.dueDate, 'due date');
  if (due.error) return { error: due.error };

  const goalId = form.goalId ? Number(form.goalId) : null;
  if (goalId !== null && (!Number.isInteger(goalId) || goalId <= 0)) return { error: 'Choose a valid goal.' };

  return {
    payload: {
      goal_id: goalId,
      title,
      notes: form.notes,
      category: category || null,
      priority: form.priority,
      status: form.status,
      due_date: due.value,
    },
  };
}

// ---- monthly intentions ----

// `month` is a 'YYYY-MM' key. Returns { payload } or { error }.
export function intentionPayload(month, text) {
  const body = text.trim();
  if (!body) return { error: 'Write an intention first.' };
  if (body.length > 500) return { error: 'Keep it under 500 characters.' };
  return { payload: { month, body } };
}
