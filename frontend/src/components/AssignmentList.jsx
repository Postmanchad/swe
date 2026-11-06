import { PRIORITY_DOT, dueTone, formatDue, isDone, priorityLabel, statusLabel } from '../utils/academic';
import { DEFAULT_COLOR } from '../utils/events';

const OVERDUE_RED = '#b4233f'; // dark enough for white text and for text on white

function AssignmentRow({ assignment: a, busy, onToggle, onEdit }) {
  const done = isDone(a.status);
  const tone = dueTone(a);
  const color = a.course_color || DEFAULT_COLOR;
  const dueClass =
    tone === 'overdue' ? 'font-medium text-[#b4233f]' : tone === 'today' ? 'font-medium text-ink' : 'text-muted';

  return (
    <li className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3">
      <input
        type="checkbox"
        checked={done}
        disabled={busy}
        onChange={() => onToggle(a)}
        aria-label={done ? `Mark "${a.title}" as not done` : `Mark "${a.title}" as submitted`}
        className="mt-1 h-4 w-4 shrink-0 accent-accent"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit(a)}
          className={`block max-w-full truncate text-left font-medium hover:underline ${done ? 'text-muted line-through' : ''}`}
        >
          {a.title}
        </button>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <span
            className="max-w-full truncate rounded px-1.5 py-0.5"
            style={{ backgroundColor: `${color}22`, borderLeft: `3px solid ${color}` }}
          >
            {a.course_name}
          </span>
          <span className={dueClass}>{formatDue(a.due)}</span>
          <span className="inline-flex items-center gap-1 text-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: PRIORITY_DOT[a.priority] }}
              aria-hidden="true"
            />
            {priorityLabel(a.priority)}
          </span>
          {a.status !== 'todo' && <span className="text-muted">{statusLabel(a.status)}</span>}
          {a.overdue && (
            <span className="rounded px-1.5 py-0.5 font-medium text-white" style={{ backgroundColor: OVERDUE_RED }}>
              Overdue
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export default function AssignmentList({ assignments, busyId, onToggle, onEdit }) {
  return (
    <ul className="space-y-2">
      {assignments.map((a) => (
        <AssignmentRow key={a.id} assignment={a} busy={busyId === a.id} onToggle={onToggle} onEdit={onEdit} />
      ))}
    </ul>
  );
}
