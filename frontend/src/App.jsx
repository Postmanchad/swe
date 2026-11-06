import { useState } from 'react';
import AcademicsPage from './pages/AcademicsPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';

const PAGES = [
  { id: 'calendar', label: 'Calendar', Page: CalendarPage },
  { id: 'academics', label: 'Courses & assignments', Page: AcademicsPage },
  { id: 'goals', label: 'Goals', Page: GoalsPage },
];

export default function App() {
  const [pageId, setPageId] = useState('calendar');
  const { Page } = PAGES.find((p) => p.id === pageId);

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Sections" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface px-4 sm:px-6">
        {PAGES.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-current={pageId === p.id ? 'page' : undefined}
            onClick={() => setPageId(p.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${
              pageId === p.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1">
        <Page />
      </div>
    </div>
  );
}
