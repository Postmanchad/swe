import { WEEKDAY_SHORT, describeDate, getMonthGrid, isSameDay, isSameMonth } from '../utils/calendar';
import { getEventsForDay } from '../utils/events';
import EventChip from './EventChip';

const MAX_CHIPS = 3;

export default function MonthView({ date, today, events, onSelectDay, onCreate, onOpenEvent }) {
  const grid = getMonthGrid(date);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_SHORT.map((name) => (
          <div key={name} className="px-2 py-2 text-sm font-medium text-muted">
            {name}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {grid.map((day) => {
          const inMonth = isSameMonth(day, date);
          const isToday = isSameDay(day, today);
          const dayEvents = getEventsForDay(events, day);
          const hidden = dayEvents.length - MAX_CHIPS;
          return (
            // Clicking empty space in a cell starts a new event on that day.
            <div
              key={day.toISOString()}
              onClick={(e) => {
                if (e.target === e.currentTarget) onCreate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0));
              }}
              className={`flex min-h-0 flex-col gap-0.5 overflow-hidden border-b border-r border-line p-1.5 ${
                inMonth ? 'bg-surface' : 'bg-canvas/60'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={describeDate(day)}
                aria-current={isToday ? 'date' : undefined}
                className={`mb-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center self-start rounded-full px-1 text-sm hover:bg-accent-soft ${
                  isToday
                    ? 'bg-accent font-semibold text-white hover:bg-accent'
                    : inMonth
                      ? 'font-medium text-ink'
                      : 'text-muted/60'
                }`}
              >
                {day.getDate()}
              </button>
              {dayEvents.slice(0, MAX_CHIPS).map((e) => (
                <EventChip key={`${e.id}-${e.start.getTime()}`} event={e} onOpen={onOpenEvent} />
              ))}
              {hidden > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className="self-start rounded px-1 text-xs text-muted hover:text-ink"
                >
                  +{hidden} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
