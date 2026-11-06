import { useState } from 'react';
import { assignments as assignmentsApi } from '../api/client.js';
import { PRIORITIES, STATUSES } from '../utils/academic';
import { assignmentFormFrom, assignmentPayloadFromForm, blankAssignmentForm } from '../utils/academicForm';
import Modal from './Modal';
import { dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from './formStyles';

// assignment is null when adding a new one; defaultCourseId pre-selects the course filter.
export default function AssignmentModal({ assignment, courses, defaultCourseId, onClose, onSaved }) {
  const isEdit = Boolean(assignment);
  const [form, setForm] = useState(() =>
    assignment ? assignmentFormFrom(assignment) : blankAssignmentForm(defaultCourseId ?? courses[0]?.id),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const { payload, error: message } = assignmentPayloadFromForm(form);
    if (message) return setError(message);

    setSaving(true);
    setError('');
    try {
      if (isEdit) await assignmentsApi.update(assignment.id, payload);
      else await assignmentsApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${assignment.title}"?`)) return;
    setSaving(true);
    try {
      await assignmentsApi.remove(assignment.id);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit assignment' : 'New assignment'} onClose={onClose}>
      {courses.length === 0 ? (
        <div>
          <p className="text-sm text-muted">Add a course first, then you can add assignments to it.</p>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="as-title" className={labelClass}>
              Title
            </label>
            <input
              id="as-title"
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Project 1 report"
              autoFocus
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="as-course" className={labelClass}>
              Course
            </label>
            <select id="as-course" className={inputClass} value={form.courseId} onChange={(e) => set('courseId', e.target.value)}>
              <option value="" disabled>
                Choose a course
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="as-date" className={labelClass}>
                Due date
              </label>
              <input id="as-date" type="date" className={inputClass} value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label htmlFor="as-time" className={labelClass}>
                Due time
              </label>
              <input id="as-time" type="time" className={inputClass} value={form.dueTime} onChange={(e) => set('dueTime', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="as-priority" className={labelClass}>
                Priority
              </label>
              <select id="as-priority" className={inputClass} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="as-status" className={labelClass}>
                Status
              </label>
              <select id="as-status" className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="as-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="as-notes"
              rows={3}
              className="w-full rounded-md border border-line bg-surface p-2 text-sm text-ink"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Requirements, grading rubric, links…"
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
      )}
    </Modal>
  );
}
