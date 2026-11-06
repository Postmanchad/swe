import { useState } from 'react';
import { courses as coursesApi } from '../api/client.js';
import { blankCourseForm, courseFormFrom, coursePayloadFromForm } from '../utils/academicForm';
import { EVENT_COLORS } from '../utils/events';
import Modal from './Modal';
import { dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from './formStyles';

// course is null when adding a new one.
export default function CourseModal({ course, onClose, onSaved, onDeleted }) {
  const isEdit = Boolean(course);
  const [form, setForm] = useState(() => (course ? courseFormFrom(course) : blankCourseForm()));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const { payload, error: message } = coursePayloadFromForm(form);
    if (message) return setError(message);

    setSaving(true);
    setError('');
    try {
      if (isEdit) await coursesApi.update(course.id, payload);
      else await coursesApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${course.name} and all of its assignments? This can't be undone.`)) return;
    setSaving(true);
    try {
      await coursesApi.remove(course.id);
      onDeleted(course.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit course' : 'New course'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="course-name" className={labelClass}>
            Course name
          </label>
          <input
            id="course-name"
            className={inputClass}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Software Engineering"
            autoFocus
            maxLength={120}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="course-code" className={labelClass}>
              Code <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="course-code"
              className={inputClass}
              value={form.code}
              onChange={(e) => set('code', e.target.value)}
              placeholder="COSC 369"
              maxLength={30}
            />
          </div>
          <div>
            <label htmlFor="course-term" className={labelClass}>
              Term <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="course-term"
              className={inputClass}
              value={form.term}
              onChange={(e) => set('term', e.target.value)}
              placeholder="Fall 2026"
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label htmlFor="course-instructor" className={labelClass}>
            Instructor <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="course-instructor"
            className={inputClass}
            value={form.instructor}
            onChange={(e) => set('instructor', e.target.value)}
            maxLength={100}
          />
        </div>

        <fieldset>
          <legend className={labelClass}>Color</legend>
          <div className="flex gap-2">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-label={c.name}
                aria-pressed={form.color === c.value}
                onClick={() => set('color', c.value)}
                className={`h-7 w-7 rounded-full ${form.color === c.value ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </fieldset>

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
