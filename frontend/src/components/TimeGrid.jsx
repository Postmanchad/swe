import { useEffect, useRef, useState } from 'react';
import {
  HOUR_HEIGHT,
  WEEKDAY_SHORT,
  describeDate,
  formatHour,
  getTimeOffset,
  isSameDay,
} from '../utils/calendar';
import { DEFAULT_COLOR, formatClock, getDaySegment, getEventsForDay, layoutColumns } from '../utils/events';
import EventChip from './EventChip';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_VISUAL_MINUTES = 30; // short events still get a readable block

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Shared by the Week view (7 days) and the Day view (1 day).
export default function TimeGrid({ days, today, events, onSelectDay, onCreate, onOpenEvent }) {
  const scrollRef = useRef(null);
  const now = useNow();

  // Open near the start of the day instead of at midnight.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, []);

  const perDay = days.map((day) => {
    const list = getEventsForDay(events, day);
    return { day, allDay: list.filter((e) => e.all_day), timed: list.filter((e) => !e.all_day) };
  });
  const hasAllDay = perDay.some((p) => p.allDay.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex border-b border-line">
        <div className="w-14 shrink-0" />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay?.(day)}
              aria-label={describeDate(day)}
              className="flex flex-1 flex-col items-center gap-1 border-l border-line py-2 hover:bg-accent-soft"
            >
              <span className="text-sm text-muted">{WEEKDAY_SHORT[day.getDay()]}</span>
              <span
                className={`flex h-8 min-w-8 items-center justify-center rounded-full px-1 text-lg font-semibold ${
                  isToday ? 'bg-accent text-white' : 'text-ink'
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {hasAllDay && (
        <div className="flex border-b border-line">
          <div className="flex w-14 shrink-0 items-start justify-end px-2 pt-1.5 text-xs text-muted">all-day</div>
          {perDay.map(({ day, allDay }) => (
            <div key={day.toISOString()} className="flex min-w-0 flex-1 flex-col gap-0.5 border-l border-line p-1">
              {allDay.map((e) => (
                <EventChip key={`${e.id}-${e.start.getTime()}`} event={e} onOpen={onOpenEvent} />
              ))}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="relative w-14 shrink-0">
            {HOURS.slice(1).map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-xs text-muted"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {formatHour(h)}
              </span>
            ))}
          </div>

          {perDay.map(({ day, timed }) => {
            const segments = timed.map((e) => getDaySegment(e, day));
            const layout = layoutColumns(
              segments.map((s) => ({ startMin: s.startMin, endMin: Math.max(s.endMin, s.startMin + MIN_VISUAL_MINUTES) })),
            );
            return (
              // Clicking an empty slot starts a new event at that half hour.
              <div
                key={day.toISOString()}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const minutes = Math.floor(((e.clientY - rect.top) / HOUR_HEIGHT) * 2) * 30;
                  onCreate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes));
                }}
                className="relative min-w-0 flex-1 cursor-cell border-l border-line"
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute inset-x-0 border-t border-line/70"
                    style={{ top: h * HOUR_HEIGHT }}
                  />
                ))}

                {timed.map((event, i) => {
                  const { startMin, endMin } = segments[i];
                  const { col, cols } = layout[i];
                  const color = event.color || DEFAULT_COLOR;
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, (MIN_VISUAL_MINUTES / 60) * HOUR_HEIGHT) - 2;
                  return (
                    <button
                      key={`${event.id}-${event.start.getTime()}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEvent(event);
                      }}
                      title={`${event.title}, ${formatClock(event.start)} – ${formatClock(event.end)}`}
                      className="absolute z-[5] cursor-pointer overflow-hidden rounded px-1.5 py-0.5 text-left text-xs leading-tight hover:brightness-95"
                      style={{
                        top: (startMin / 60) * HOUR_HEIGHT + 1,
                        height,
                        left: `calc(${(col / cols) * 100}% + 1px)`,
                        width: `calc(${100 / cols}% - 3px)`,
                        backgroundColor: `${color}26`,
                        borderLeft: `3px solid ${color}`,
                        color: 'var(--color-ink)',
                      }}
                    >
                      <span className="block truncate font-medium">
                        {event.recurring && <span aria-label="repeats">↻ </span>}
                        {event.title}
                      </span>
                      <span className="block truncate text-muted">
                        {formatClock(event.start)} – {formatClock(event.end)}
                      </span>
                    </button>
                  );
                })}

                {isSameDay(day, now) && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: getTimeOffset(now) }}
                    aria-hidden="true"
                  >
                    <span className="-ml-1 h-2 w-2 rounded-full bg-now" />
                    <span className="h-px flex-1 bg-now" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
