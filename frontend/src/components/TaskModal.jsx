import { useState } from 'react';
import { tasks as tasksApi } from '../api/client.js';
import { PRIORITIES } from '../utils/academic';
import { blankTaskForm, taskFormFrom, taskPayloadFromForm } from '../utils/goalForm';
import { TASK_STATUSES } from '../utils/goals';
import Modal from './Modal';
import { dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from './formStyles';

// task is null when adding a new one. goals fills the "Goal" dropdown.
export default function TaskModal({ task, goals, defaultGoalId, onClose, onSaved }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState(() => (task ? taskFormFrom(task) : blankTaskForm(defaultGoalId)));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const { payload, error: message } = taskPayloadFromForm(form);
    if (message) return setError(message);

    setSaving(true);
    setError('');
    try {
      if (isEdit) await tasksApi.update(task.id, payload);
      else await tasksApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setSaving(true);
    try {
      await tasksApi.remove(task.id);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className={labelClass}>
            Task
          </label>
          <input
            id="task-title"
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Read chapter 3"
            autoFocus
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="task-goal" className={labelClass}>
            Goal
          </label>
          <select id="task-goal" className={inputClass} value={form.goalId} onChange={(e) => set('goalId', e.target.value)}>
            <option value="">No goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-priority" className={labelClass}>
              Priority
            </label>
            <select id="task-priority" className={inputClass} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-status" className={labelClass}>
              Status
            </label>
            <select id="task-status" className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-due" className={labelClass}>
              Due date <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="task-due" type="date" className={inputClass} value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
          <div>
            <label htmlFor="task-category" className={labelClass}>
              Category <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="task-category"
              className={inputClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label htmlFor="task-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="task-notes"
            rows={3}
            className="w-full rounded-md border border-line bg-surface p-2 text-sm text-ink"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            maxLength={10000}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-now/40 bg-now/10 px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={saving} className={dangerButton}>
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
