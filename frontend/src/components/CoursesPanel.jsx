import { DEFAULT_COLOR } from '../utils/events';

// Course list that doubles as the course filter for the assignments next to it.
export default function CoursesPanel({ courses, loading, selectedId, onSelect, onAdd, onEdit }) {
  const rowBase = 'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm';
  const rowState = (active) => (active ? 'bg-accent-soft font-medium' : 'hover:bg-accent-soft/60');

  return (
    <section aria-label="Courses" className="rounded-lg border border-line bg-surface p-3">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="flex-1 text-base font-semibold">Courses</h2>
        <button
          type="button"
          onClick={onAdd}
          className="h-8 rounded-md border border-line px-2.5 text-sm font-medium hover:bg-accent-soft"
        >
          + Add
        </button>
      </div>

      {!loading && courses.length === 0 ? (
        <p className="px-1 py-3 text-sm text-muted">No courses yet. Add one to start tracking assignments.</p>
      ) : (
        <ul className="space-y-0.5">
          <li className="flex">
            <button
              type="button"
              aria-pressed={selectedId === null}
              onClick={() => onSelect(null)}
              className={`${rowBase} ${rowState(selectedId === null)}`}
            >
              All courses
            </button>
          </li>
          {courses.map((c) => (
            <li key={c.id} className="flex items-center gap-1">
              <button
                type="button"
                aria-pressed={selectedId === c.id}
                onClick={() => onSelect(c.id)}
                className={`${rowBase} ${rowState(selectedId === c.id)}`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color || DEFAULT_COLOR }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">
                  {c.name}
                  {c.code && <span className="ml-1.5 text-xs text-muted">{c.code}</span>}
                </span>
                {c.open_assignments > 0 && (
                  <span
                    className="shrink-0 rounded-full bg-canvas px-1.5 text-xs text-muted"
                    title={`${c.open_assignments} open`}
                  >
                    {c.open_assignments}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onEdit(c)}
                aria-label={`Edit ${c.name}`}
                className="shrink-0 rounded px-1.5 py-1 text-xs text-muted hover:bg-accent-soft hover:text-ink"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
