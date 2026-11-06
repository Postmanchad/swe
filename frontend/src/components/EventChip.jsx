import { DEFAULT_COLOR, formatClock } from '../utils/events';

const OVERDUE_RED = '#b4233f';

// A one-line label used in the month view and the all-day row.
// Calendar events are tinted; assignment due dates are outlined and start with "Due".
export default function EventChip({ event, onOpen }) {
  const color = event.color || DEFAULT_COLOR;
  const open = (e) => {
    e.stopPropagation();
    onOpen(event);
  };

  if (event.kind === 'assignment') {
    const label = `${event.done ? '✓ ' : ''}Due ${formatClock(event.start)} · ${event.title}`;
    return (
      <button
        type="button"
        onClick={open}
        title={`${label} (${event.courseName})`}
        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs hover:brightness-95 ${
          event.done ? 'line-through opacity-60' : ''
        }`}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: `1.5px solid ${event.overdue ? OVERDUE_RED : color}`,
          color: event.overdue ? OVERDUE_RED : 'var(--color-ink)',
        }}
      >
        {label}
      </button>
    );
  }

  const label = event.all_day ? event.title : `${formatClock(event.start)} ${event.title}`;
  return (
    <button
      type="button"
      onClick={open}
      title={label}
      className="block w-full truncate rounded px-1.5 py-0.5 text-left text-xs hover:brightness-95"
      style={
        event.all_day
          ? { backgroundColor: color, color: '#fff' }
          : { backgroundColor: `${color}22`, borderLeft: `3px solid ${color}`, color: 'var(--color-ink)' }
      }
    >
      {event.recurring && <span aria-label="repeats">↻ </span>}
      {label}
    </button>
  );
}
