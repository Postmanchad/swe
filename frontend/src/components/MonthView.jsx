import { WEEKDAY_SHORT, describeDate, getMonthGrid, isSameDay, isSameMonth } from '../utils/calendar';

export default function MonthView({ date, today, onSelectDay }) {
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
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-label={describeDate(day)}
              aria-current={isToday ? 'date' : undefined}
              className={`flex flex-col items-start border-b border-r border-line p-2 text-left hover:bg-accent-soft ${
                inMonth ? 'bg-surface' : 'bg-canvas/60'
              }`}
            >
              <span
                className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm ${
                  isToday
                    ? 'bg-accent font-semibold text-white'
                    : inMonth
                      ? 'font-medium text-ink'
                      : 'text-muted/60'
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
