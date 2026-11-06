import { useState } from 'react';
import { goals as goalsApi } from '../api/client.js';
import { PRIORITIES } from '../utils/academic';
import { blankGoalForm, goalFormFrom, goalPayloadFromForm } from '../utils/goalForm';
import { GOAL_STATUSES, KINDS } from '../utils/goals';
import Modal from './Modal';
import { dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from './formStyles';

// goal is null when adding a new one; defaultKind pre-selects short- or long-term.
export default function GoalModal({ goal, defaultKind, onClose, onSaved }) {
  const isEdit = Boolean(goal);
  const [form, setForm] = useState(() => (goal ? goalFormFrom(goal) : blankGoalForm(defaultKind)));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const { payload, error: message } = goalPayloadFromForm(form);
    if (message) return setError(message);

    setSaving(true);
    setError('');
    try {
      if (isEdit) await goalsApi.update(goal.id, payload);
      else await goalsApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${goal.title}" and all of its tasks? This can't be undone.`)) return;
    setSaving(true);
    try {
      await goalsApi.remove(goal.id);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit goal' : 'New goal'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="goal-title" className={labelClass}>
            Goal
          </label>
          <input
            id="goal-title"
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Finish the semester with a 3.5 GPA"
            autoFocus
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="goal-kind" className={labelClass}>
              Type
            </label>
            <select id="goal-kind" className={inputClass} value={form.kind} onChange={(e) => set('kind', e.target.value)}>
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="goal-target" className={labelClass}>
              Target date <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="goal-target"
              type="date"
              className={inputClass}
              value={form.targetDate}
              onChange={(e) => set('targetDate', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="goal-priority" className={labelClass}>
              Priority
            </label>
            <select id="goal-priority" className={inputClass} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="goal-category" className={labelClass}>
              Category <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="goal-category"
              className={inputClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="School, Health…"
              maxLength={50}
            />
          </div>
        </div>

        {isEdit && (
          <div>
            <label htmlFor="goal-status" className={labelClass}>
              Status
            </label>
            <select id="goal-status" className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {GOAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="goal-description" className={labelClass}>
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="goal-description"
            rows={3}
            className="w-full rounded-md border border-line bg-surface p-2 text-sm text-ink"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Why this matters, what success looks like…"
            maxLength={5000}
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
