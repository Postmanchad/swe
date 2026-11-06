import { useState } from 'react';
import { intentions as intentionsApi } from '../api/client.js';
import { useIntentions } from '../hooks/useGoals';
import { intentionPayload } from '../utils/goalForm';
import { formatMonthKey, monthKey, shiftMonthKey } from '../utils/goals';

const navButton = 'h-8 w-8 rounded-md border border-line bg-surface text-sm hover:bg-accent-soft';

// A short list of intentions for one month, with month navigation. Manages its own data.
export default function IntentionsPanel() {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useIntentions(month);

  // Runs an API call, then reloads the list. Returns true when it worked.
  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      list.reload();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const { payload, error: message } = intentionPayload(month, text);
    if (message) return setError(message);
    if (await run(() => intentionsApi.create(payload))) setText('');
  }

  const shownError = error || list.error;

  return (
    <section aria-label="Monthly intentions" className="rounded-lg border border-line bg-surface p-3">
      <h2 className="mb-2 text-base font-semibold">Monthly intentions</h2>

      <div className="mb-3 flex items-center gap-2">
        <button type="button" className={navButton} onClick={() => setMonth((m) => shiftMonthKey(m, -1))} aria-label="Previous month">
          ‹
        </button>
        <p className="flex-1 text-center text-sm font-medium" aria-live="polite">
          {formatMonthKey(month)}
        </p>
        <button type="button" className={navButton} onClick={() => setMonth((m) => shiftMonthKey(m, 1))} aria-label="Next month">
          ›
        </button>
      </div>

      {!list.loading && list.items.length === 0 ? (
        <p className="py-2 text-sm text-muted">Nothing set for this month. What do you want to focus on?</p>
      ) : (
        <ul className="mb-2 space-y-1">
          {list.items.map((i) => (
            <li key={i.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={i.done}
                disabled={busy}
                onChange={() => run(() => intentionsApi.update(i.id, { done: !i.done }))}
                aria-label={i.done ? `Mark "${i.body}" as not done` : `Mark "${i.body}" as done`}
                className="mt-1 h-4 w-4 shrink-0 accent-accent"
              />
              <span className={`min-w-0 flex-1 break-words text-sm ${i.done ? 'text-muted line-through' : ''}`}>{i.body}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => intentionsApi.remove(i.id))}
                aria-label={`Delete "${i.body}"`}
                className="shrink-0 rounded px-1.5 text-sm text-muted hover:bg-accent-soft hover:text-ink disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          aria-label="New intention"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Sleep before midnight"
          maxLength={500}
          className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-2 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-9 rounded-md border border-line px-3 text-sm font-medium hover:bg-accent-soft disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {shownError && (
        <p role="alert" className="mt-2 rounded-md border border-now/40 bg-now/10 px-3 py-2 text-sm">
          {shownError}
        </p>
      )}
    </section>
  );
}
