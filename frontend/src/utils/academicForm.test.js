import { describe, it, expect } from 'vitest';
import {
  assignmentFormFrom,
  assignmentPayloadFromForm,
  blankAssignmentForm,
  blankCourseForm,
  courseFormFrom,
  coursePayloadFromForm,
} from './academicForm';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);

describe('coursePayloadFromForm', () => {
  const filled = () => ({ ...blankCourseForm(), name: 'Software Engineering' });

  it('requires a name and enforces length limits', () => {
    expect(coursePayloadFromForm(blankCourseForm()).error).toBe('Give the course a name.');
    expect(coursePayloadFromForm({ ...filled(), name: 'x'.repeat(121) }).error).toBe(
      'The course name is too long (120 characters max).',
    );
    expect(coursePayloadFromForm({ ...filled(), code: 'x'.repeat(31) }).error).toBe(
      'Course code is too long (30 characters max).',
    );
  });

  it('trims text and sends null for blank optional fields', () => {
    const { payload } = coursePayloadFromForm({ ...filled(), name: '  Software Engineering ', code: ' COSC 369 ', term: '  ' });
    expect(payload).toEqual({
      name: 'Software Engineering',
      code: 'COSC 369',
      term: null,
      instructor: null,
      color: '#3a5bdb',
    });
  });

  it('round-trips a stored course', () => {
    const course = { name: 'Databases', code: 'COSC 410', term: 'Fall 2026', instructor: 'Dr. Lee', color: '#0f8b7d' };
    expect(coursePayloadFromForm(courseFormFrom(course)).payload).toEqual(course);
  });
});

describe('blankAssignmentForm', () => {
  it('defaults to due tomorrow at 11:59 PM, medium priority, to do', () => {
    const f = blankAssignmentForm(4, d(2026, 11, 3, 10));
    expect(f).toEqual({
      title: '',
      courseId: '4',
      dueDate: '2026-11-04',
      dueTime: '23:59',
      priority: 'medium',
      status: 'todo',
      notes: '',
    });
  });

  it('leaves the course empty when none is given', () => {
    expect(blankAssignmentForm(null, d(2026, 11, 3)).courseId).toBe('');
  });
});

describe('assignmentPayloadFromForm', () => {
  const good = () => ({ ...blankAssignmentForm(4, d(2026, 11, 3, 10)), title: 'Project 1' });

  it('builds the API body with an ISO due time', () => {
    const { payload, error } = assignmentPayloadFromForm(good());
    expect(error).toBe(undefined);
    expect(payload).toEqual({
      course_id: 4,
      title: 'Project 1',
      notes: '',
      due_at: d(2026, 11, 4, 23, 59).toISOString(),
      priority: 'medium',
      status: 'todo',
    });
  });

  it('reports the first problem in plain words', () => {
    expect(assignmentPayloadFromForm({ ...good(), title: ' ' }).error).toBe('Give the assignment a title.');
    expect(assignmentPayloadFromForm({ ...good(), courseId: '' }).error).toBe('Choose a course.');
    expect(assignmentPayloadFromForm({ ...good(), dueDate: '2026-02-30' }).error).toBe('Pick a due date.');
    expect(assignmentPayloadFromForm({ ...good(), dueTime: '' }).error).toBe('Enter a due time.');
    expect(assignmentPayloadFromForm({ ...good(), priority: 'urgent' }).error).toBe('Choose a priority.');
    expect(assignmentPayloadFromForm({ ...good(), status: 'late' }).error).toBe('Choose a status.');
  });

  it('round-trips a stored assignment', () => {
    const stored = {
      course_id: 9,
      title: 'Lab 3',
      notes: 'Bring laptop',
      due_at: d(2026, 12, 1, 14, 30).toISOString(),
      priority: 'high',
      status: 'in_progress',
    };
    expect(assignmentPayloadFromForm(assignmentFormFrom(stored)).payload).toEqual(stored);
  });
});
