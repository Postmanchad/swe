import { describe, it, expect } from 'vitest';
import {
  blankGoalForm,
  blankTaskForm,
  goalFormFrom,
  goalPayloadFromForm,
  intentionPayload,
  taskFormFrom,
  taskPayloadFromForm,
} from './goalForm';

describe('goalPayloadFromForm', () => {
  const filled = () => ({ ...blankGoalForm(), title: 'Finish the semester strong' });

  it('builds the API body with null for blank optional fields', () => {
    expect(goalPayloadFromForm(filled()).payload).toEqual({
      title: 'Finish the semester strong',
      description: '',
      kind: 'short_term',
      category: null,
      priority: 'medium',
      status: 'active',
      target_date: null,
    });
  });

  it('keeps a valid target date and trims the category', () => {
    const { payload } = goalPayloadFromForm({ ...filled(), kind: 'long_term', category: ' School ', targetDate: '2027-05-15' });
    expect(payload.kind).toBe('long_term');
    expect(payload.category).toBe('School');
    expect(payload.target_date).toBe('2027-05-15');
  });

  it('explains what is wrong in plain words', () => {
    expect(goalPayloadFromForm(blankGoalForm()).error).toBe('Give the goal a title.');
    expect(goalPayloadFromForm({ ...filled(), targetDate: '2026-02-30' }).error).toBe('Pick a valid target date.');
    expect(goalPayloadFromForm({ ...filled(), category: 'x'.repeat(51) }).error).toBe(
      'The category is too long (50 characters max).',
    );
    expect(goalPayloadFromForm({ ...filled(), priority: 'urgent' }).error).toBe('Choose a priority.');
  });

  it('round-trips a stored goal, ignoring the computed progress fields', () => {
    const goal = {
      title: 'Run a 5K',
      description: 'Train 3x a week',
      kind: 'long_term',
      category: 'Health',
      priority: 'high',
      status: 'active',
      target_date: '2027-03-01',
      progress: 40,
      task_total: 5,
      task_done: 2,
    };
    expect(goalPayloadFromForm(goalFormFrom(goal)).payload).toEqual({
      title: 'Run a 5K',
      description: 'Train 3x a week',
      kind: 'long_term',
      category: 'Health',
      priority: 'high',
      status: 'active',
      target_date: '2027-03-01',
    });
  });
});

describe('taskPayloadFromForm', () => {
  const filled = () => ({ ...blankTaskForm(7), title: 'Read chapter 3' });

  it('attaches the task to its goal', () => {
    const { payload } = taskPayloadFromForm(filled());
    expect(payload.goal_id).toBe(7);
    expect(payload.status).toBe('todo');
    expect(payload.due_date).toBe(null);
  });

  it('sends goal_id null for a standalone task', () => {
    expect(taskPayloadFromForm({ ...filled(), goalId: '' }).payload.goal_id).toBe(null);
  });

  it('validates the title, due date and status', () => {
    expect(taskPayloadFromForm({ ...filled(), title: ' ' }).error).toBe('Give the task a title.');
    expect(taskPayloadFromForm({ ...filled(), dueDate: '13/01/2026' }).error).toBe('Pick a valid due date.');
    expect(taskPayloadFromForm({ ...filled(), status: 'submitted' }).error).toBe('Choose a status.');
  });

  it('round-trips a stored task', () => {
    const task = {
      goal_id: 3,
      title: 'Draft outline',
      notes: 'Use the template',
      category: 'Writing',
      priority: 'low',
      status: 'in_progress',
      due_date: '2026-11-20',
    };
    expect(taskPayloadFromForm(taskFormFrom(task)).payload).toEqual(task);
  });
});

describe('intentionPayload', () => {
  it('trims the text and attaches the month', () => {
    expect(intentionPayload('2026-11', '  Sleep before midnight ').payload).toEqual({
      month: '2026-11',
      body: 'Sleep before midnight',
    });
  });

  it('rejects empty or very long intentions', () => {
    expect(intentionPayload('2026-11', '   ').error).toBe('Write an intention first.');
    expect(intentionPayload('2026-11', 'x'.repeat(501)).error).toBe('Keep it under 500 characters.');
  });
});
