import { useState } from 'react';
import CalendarHeader from './components/CalendarHeader';
import MonthView from './components/MonthView';
import TimeGrid from './components/TimeGrid';
import YearView from './components/YearView';
import { getWeekDays, shiftDate, startOfDay } from './utils/calendar';

export default function App() {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const today = startOfDay(new Date());

  const openDay = (day) => {
    setDate(day);
    setView('day');
  };
  const openMonth = (day) => {
    setDate(day);
    setView('month');
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
      />

      <main className="min-h-0 flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
        {view === 'month' && <MonthView date={date} today={today} onSelectDay={openDay} />}
        {view === 'week' && <TimeGrid days={getWeekDays(date)} today={today} onSelectDay={openDay} />}
        {view === 'day' && <TimeGrid days={[date]} today={today} />}
        {view === 'year' && (
          <YearView date={date} today={today} onSelectMonth={openMonth} onSelectDay={openDay} />
        )}
      </main>
    </div>
  );
}
