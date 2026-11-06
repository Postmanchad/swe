// Converts between course/assignment records and the values the forms edit.

import { addDays } from './calendar';
import { PRIORITIES, STATUSES } from './academic';
import { combineLocal, parseLocalDate } from './eventForm';
import { DEFAULT_COLOR, toDateInput, toTimeInput } from './events';

// ---- courses ----

export const blankCourseForm = () => ({ name: '', code: '', term: '', instructor: '', color: DEFAULT_COLOR });

export const courseFormFrom = (course) => ({
  name: course.name ?? '',
  code: course.code ?? '',
  term: course.term ?? '',
  instructor: course.instructor ?? '',
  color: course.color ?? DEFAULT_COLOR,
});

// Returns { payload } for the API, or { error } with a message for the user.
export function coursePayloadFromForm(form) {
  const name = form.name.trim();
  if (!name) return { error: 'Give the course a name.' };
  if (name.length > 120) return { error: 'The course name is too long (120 characters max).' };

  const optional = {};
  for (const [key, label, max] of [
    ['code', 'Course code', 30],
    ['term', 'Term', 50],
    ['instructor', 'Instructor', 100],
  ]) {
    const value = form[key].trim();
    if (value.length > max) return { error: `${label} is too long (${max} characters max).` };
    optional[key] = value || null;
  }
  return { payload: { name, ...optional, color: form.color } };
}

// ---- assignments ----

// A new assignment defaults to due tomorrow at 11:59 PM.
export function blankAssignmentForm(courseId, now = new Date()) {
  return {
    title: '',
    courseId: courseId ? String(courseId) : '',
    dueDate: toDateInput(addDays(now, 1)),
    dueTime: '23:59',
    priority: 'medium',
    status: 'todo',
    notes: '',
  };
}

export function assignmentFormFrom(a) {
  const due = new Date(a.due_at);
  return {
    title: a.title ?? '',
    courseId: String(a.course_id),
    dueDate: toDateInput(due),
    dueTime: toTimeInput(due),
    priority: a.priority,
    status: a.status,
    notes: a.notes ?? '',
  };
}

export function assignmentPayloadFromForm(form) {
  const title = form.title.trim();
  if (!title) return { error: 'Give the assignment a title.' };
  if (title.length > 200) return { error: 'The title is too long (200 characters max).' };

  const courseId = Number(form.courseId);
  if (!form.courseId || !Number.isInteger(courseId) || courseId <= 0) return { error: 'Choose a course.' };

  if (!parseLocalDate(form.dueDate)) return { error: 'Pick a due date.' };
  const due = combineLocal(form.dueDate, form.dueTime);
  if (!due) return { error: 'Enter a due time.' };

  if (!PRIORITIES.some((p) => p.value === form.priority)) return { error: 'Choose a priority.' };
  if (!STATUSES.some((s) => s.value === form.status)) return { error: 'Choose a status.' };
  if (form.notes.length > 10_000) return { error: 'The notes are too long (10,000 characters max).' };

  return {
    payload: {
      course_id: courseId,
      title,
      notes: form.notes,
      due_at: due.toISOString(),
      priority: form.priority,
      status: form.status,
    },
  };
}
