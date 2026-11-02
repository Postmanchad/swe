import { useEffect, useRef, useState } from 'react';
import {
  HOUR_HEIGHT,
  WEEKDAY_SHORT,
  describeDate,
  formatHour,
  getTimeOffset,
  isSameDay,
} from '../utils/calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Shared by the Week view (7 days) and the Day view (1 day).
export default function TimeGrid({ days, today, onSelectDay }) {
  const scrollRef = useRef(null);
  const now = useNow();

  // Open near the start of the day instead of at midnight.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, []);

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

          {days.map((day) => (
            <div key={day.toISOString()} className="relative flex-1 border-l border-line">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-line/70"
                  style={{ top: h * HOUR_HEIGHT }}
                />
              ))}
              {isSameDay(day, now) && (
                <div
                  className="absolute inset-x-0 z-10 flex items-center"
                  style={{ top: getTimeOffset(now) }}
                  aria-hidden="true"
                >
                  <span className="-ml-1 h-2 w-2 rounded-full bg-now" />
                  <span className="h-px flex-1 bg-now" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
