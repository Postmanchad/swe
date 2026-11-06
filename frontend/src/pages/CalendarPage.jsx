import { useMemo, useState } from 'react';
import CalendarHeader from '../components/CalendarHeader';
import EventModal from '../components/EventModal';
import MonthView from '../components/MonthView';
import TimeGrid from '../components/TimeGrid';
import YearView from '../components/YearView';
import useEvents from '../hooks/useEvents';
import { getWeekDays, shiftDate, startOfDay } from '../utils/calendar';
import { eventDayKeys } from '../utils/events';

export default function CalendarPage() {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [target, setTarget] = useState(null); // null, { mode: 'create', start } or { mode: 'edit', id }
  const today = startOfDay(new Date());

  const { events, error, reload } = useEvents(view, date);
  const eventKeys = useMemo(() => eventDayKeys(events), [events]);

  const openDay = (day) => {
    setDate(day);
    setView('day');
  };
  const openMonth = (day) => {
    setDate(day);
    setView('month');
  };
  const createAt = (start) => setTarget({ mode: 'create', start });
  const edit = (event) => setTarget({ mode: 'edit', id: event.id });
  const closeModal = () => setTarget(null);
  const saved = () => {
    setTarget(null);
    reload();
  };

  return (
    <div className="flex h-full flex-col">
      <CalendarHeader
        view={view}
        date={date}
        onViewChange={setView}
        onPrev={() => setDate((d) => shiftDate(view, d, -1))}
        onNext={() => setDate((d) => shiftDate(view, d, 1))}
        onToday={() => setDate(startOfDay(new Date()))}
        onNewEvent={() => createAt(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0))}
      />

      {error && (
        <div
          role="alert"
          className="mx-4 mb-3 flex items-center gap-3 rounded-md border border-now/40 bg-now/10 px-3 py-2 text-sm sm:mx-6"
        >
          <span className="flex-1">{error}</span>
          <button type="button" onClick={reload} className="font-medium text-accent hover:underline">
            Retry
          </button>
        </div>
      )}

      <main className="min-h-0 flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
        {view === 'month' && (
          <MonthView
            date={date}
            today={today}
            events={events}
            onSelectDay={openDay}
            onCreate={createAt}
            onOpenEvent={edit}
          />
        )}
        {view === 'week' && (
          <TimeGrid
            days={getWeekDays(date)}
            today={today}
            events={events}
            onSelectDay={openDay}
            onCreate={createAt}
            onOpenEvent={edit}
          />
        )}
        {view === 'day' && (
          <TimeGrid days={[date]} today={today} events={events} onCreate={createAt} onOpenEvent={edit} />
        )}
        {view === 'year' && (
          <YearView date={date} today={today} eventKeys={eventKeys} onSelectMonth={openMonth} onSelectDay={openDay} />
        )}
      </main>

      {target && (
        <EventModal
          key={target.mode === 'edit' ? `edit-${target.id}` : `new-${target.start.getTime()}`}
          target={target}
          onClose={closeModal}
          onSaved={saved}
        />
      )}
    </div>
  );
}
