import { useState } from 'react';
import AcademicsPage from './pages/AcademicsPage';
import CalendarPage from './pages/CalendarPage';

const PAGES = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'academics', label: 'Courses & assignments' },
];

export default function App() {
  const [page, setPage] = useState('calendar');

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Sections" className="flex shrink-0 gap-1 border-b border-line bg-surface px-4 sm:px-6">
        {PAGES.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-current={page === p.id ? 'page' : undefined}
            onClick={() => setPage(p.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium ${
              page === p.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1">{page === 'calendar' ? <CalendarPage /> : <AcademicsPage />}</div>
    </div>
  );
}
