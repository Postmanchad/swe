import { DEFAULT_COLOR, formatClock } from '../utils/events';

// A one-line event label used in the month view and the all-day row.
export default function EventChip({ event, onOpen }) {
  const color = event.color || DEFAULT_COLOR;
  const solid = event.all_day;
  const label = event.all_day ? event.title : `${formatClock(event.start)} ${event.title}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(event);
      }}
      title={label}
      className="block w-full truncate rounded px-1.5 py-0.5 text-left text-xs hover:brightness-95"
      style={
        solid
          ? { backgroundColor: color, color: '#fff' }
          : { backgroundColor: `${color}22`, borderLeft: `3px solid ${color}`, color: 'var(--color-ink)' }
      }
    >
      {event.recurring && <span aria-label="repeats">↻ </span>}
      {label}
    </button>
  );
}
