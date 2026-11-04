import { useEffect, useState } from 'react';
import { events as eventsApi, localTimeZone } from '../api/client.js';
import { WEEKDAY_LONG } from '../utils/calendar';
import { EVENT_COLORS } from '../utils/events';
import { formFromEvent, formFromSlot, payloadFromForm } from '../utils/eventForm';

const inputClass = 'h-9 w-full rounded-md border border-line bg-surface px-2 text-sm text-ink';
const labelClass = 'mb-1 block text-sm font-medium text-ink';

// target is { mode: 'create', start: Date } or { mode: 'edit', id }.
// Editing always edits the stored event, so for a repeating class it changes the whole series.
export default function EventModal({ target, onClose, onSaved }) {
  const isEdit = target.mode === 'edit';
  const [form, setForm] = useState(() => (isEdit ? null : formFromSlot(target.start)));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load the stored event when editing.
  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    eventsApi
      .get(target.id)
      .then((ev) => !cancelled && setForm(formFromEvent(ev)))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [isEdit, target.id]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleDay = (n) =>
    setForm((f) => ({
      ...f,
      repeatDays: f.repeatDays.includes(n) ? f.repeatDays.filter((x) => x !== n) : [...f.repeatDays, n],
    }));

  async function handleSubmit(e) {
    e.preventDefault();
    const { payload, error: message } = payloadFromForm(form);
    if (message) return setError(message);

    setSaving(true);
    setError('');
    try {
      if (isEdit) await eventsApi.update(target.id, { ...payload, tz: localTimeZone });
      else await eventsApi.create(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    const what = form.repeatDays.length ? 'this repeating event and every occurrence' : 'this event';
    if (!window.confirm(`Delete ${what}?`)) return;
    setSaving(true);
    try {
      await eventsApi.remove(target.id);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit event' : 'New event'}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-t-xl bg-surface p-5 shadow-xl sm:rounded-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">{isEdit ? 'Edit event' : 'New event'}</h2>

        {!form ? (
          <p className="py-8 text-center text-sm text-muted" role={error ? 'alert' : undefined}>
            {error || 'Loading…'}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ev-title" className={labelClass}>
                Title
              </label>
              <input
                id="ev-title"
                className={inputClass}
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. COSC 369 lecture"
                autoFocus
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="ev-date" className={labelClass}>
                  {form.repeatDays.length ? 'First date' : 'Date'}
                </label>
                <input id="ev-date" type="date" className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} />
              </div>
              <div>
                <label htmlFor="ev-start" className={labelClass}>
                  Start
                </label>
                <input
                  id="ev-start"
                  type="time"
                  className={`${inputClass} disabled:opacity-40`}
                  value={form.startTime}
                  disabled={form.allDay}
                  onChange={(e) => set('startTime', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ev-end" className={labelClass}>
                  End
                </label>
                <input
                  id="ev-end"
                  type="time"
                  className={`${inputClass} disabled:opacity-40`}
                  value={form.endTime}
                  disabled={form.allDay}
                  onChange={(e) => set('endTime', e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.allDay} onChange={(e) => set('allDay', e.target.checked)} />
              All-day
            </label>

            <fieldset>
              <legend className={labelClass}>Repeat on</legend>
              <div className="flex gap-1.5">
                {WEEKDAY_LONG.map((name, n) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={form.repeatDays.includes(n)}
                    onClick={() => toggleDay(n)}
                    className={`h-9 w-9 rounded-full border text-sm font-medium ${
                      form.repeatDays.includes(n)
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-surface text-ink hover:bg-accent-soft'
                    }`}
                  >
                    {name[0]}
                  </button>
                ))}
              </div>
              {form.repeatDays.length > 0 && (
                <div className="mt-3 max-w-48">
                  <label htmlFor="ev-until" className={labelClass}>
                    Repeat until <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    id="ev-until"
                    type="date"
                    className={inputClass}
                    value={form.repeatUntil}
                    onChange={(e) => set('repeatUntil', e.target.value)}
                  />
                </div>
              )}
              {isEdit && form.repeatDays.length > 0 && (
                <p className="mt-2 text-xs text-muted">Changes apply to every occurrence in this series.</p>
              )}
            </fieldset>

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

            <div>
              <label htmlFor="ev-notes" className={labelClass}>
                Notes
              </label>
              <textarea
                id="ev-notes"
                rows={4}
                className="w-full rounded-md border border-line bg-surface p-2 text-sm text-ink"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Room number, reading to finish, questions to ask…"
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
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="h-9 rounded-md px-3 text-sm font-medium text-now hover:bg-now/10 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-md border border-line px-3 text-sm font-medium hover:bg-accent-soft"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-9 rounded-md bg-accent px-4 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
