import {
  MONTH_NAMES,
  WEEKDAY_LONG,
  describeDate,
  getMonthGrid,
  getYearMonths,
  isSameDay,
  isSameMonth,
} from '../utils/calendar';
import { toDateInput } from '../utils/events';

function MiniMonth({ month, today, eventKeys, onSelectMonth, onSelectDay }) {
  const grid = getMonthGrid(month);
  const isCurrentMonth = isSameMonth(month, today);

  return (
    <section className="rounded-lg border border-line bg-surface p-3">
      <button
        type="button"
        onClick={() => onSelectMonth(month)}
        className={`mb-2 rounded px-1 text-base font-semibold hover:bg-accent-soft ${
          isCurrentMonth ? 'text-accent' : 'text-ink'
        }`}
      >
        {MONTH_NAMES[month.getMonth()]}
      </button>

      <div className="grid grid-cols-7 text-center text-xs">
        {WEEKDAY_LONG.map((name) => (
          <span key={name} className="py-1 text-muted" aria-hidden="true">
            {name[0]}
          </span>
        ))}
        {grid.map((day) => {
          if (!isSameMonth(day, month)) {
            return <span key={day.toISOString()} aria-hidden="true" />;
          }
          const isToday = isSameDay(day, today);
          const hasEvents = eventKeys.has(toDateInput(day));
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-label={`${describeDate(day)}${hasEvents ? ', has events' : ''}`}
              aria-current={isToday ? 'date' : undefined}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                isToday ? 'bg-accent font-semibold text-white' : 'text-ink hover:bg-accent-soft'
              }`}
            >
              {day.getDate()}
              {hasEvents && (
                <span
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-accent'}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function YearView({ date, today, eventKeys, onSelectMonth, onSelectDay }) {
  return (
    <div className="grid h-full grid-cols-1 content-start gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {getYearMonths(date.getFullYear()).map((month) => (
        <MiniMonth
          key={month.getMonth()}
          month={month}
          today={today}
          eventKeys={eventKeys}
          onSelectMonth={onSelectMonth}
          onSelectDay={onSelectDay}
        />
      ))}
    </div>
  );
}
