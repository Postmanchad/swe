import { VIEWS, getTitle } from '../utils/calendar';

const LABELS = { day: 'Day', week: 'Week', month: 'Month', year: 'Year' };

const navButton =
  'h-9 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-accent-soft';

export default function CalendarHeader({ view, date, onViewChange, onPrev, onNext, onToday }) {
  return (
    <header className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        <button type="button" className={navButton} onClick={onToday}>
          Today
        </button>
        <button type="button" className={`${navButton} w-9 px-0`} onClick={onPrev} aria-label={`Previous ${view}`}>
          ‹
        </button>
        <button type="button" className={`${navButton} w-9 px-0`} onClick={onNext} aria-label={`Next ${view}`}>
          ›
        </button>
      </div>

      <h1 className="min-w-0 flex-1 text-xl font-semibold tracking-tight sm:text-2xl" aria-live="polite">
        {getTitle(view, date)}
      </h1>

      <div role="group" aria-label="Calendar view" className="flex rounded-md border border-line bg-surface p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => onViewChange(v)}
            className={`h-8 rounded px-3 text-sm font-medium ${
              view === v ? 'bg-accent text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {LABELS[v]}
          </button>
        ))}
      </div>
    </header>
  );
}
