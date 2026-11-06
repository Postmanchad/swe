import { useState } from 'react';
import { assignments as assignmentsApi } from '../api/client.js';
import AssignmentList from '../components/AssignmentList';
import AssignmentModal from '../components/AssignmentModal';
import CourseModal from '../components/CourseModal';
import CoursesPanel from '../components/CoursesPanel';
import { primaryButton } from '../components/formStyles';
import { useAssignments, useCourses } from '../hooks/useAcademics';
import { PRIORITIES, SORTS, STATUS_FILTERS, buildAssignmentQuery, isDone } from '../utils/academic';

const selectClass = 'h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink';

export default function AcademicsPage() {
  const [filters, setFilters] = useState({ courseId: null, status: 'open', priority: '', sort: 'due' });
  const [modal, setModal] = useState(null); // { kind: 'course' | 'assignment', item: record | null }
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const courses = useCourses();
  const assignments = useAssignments(buildAssignmentQuery(filters));

  const setFilter = (field, value) => setFilters((f) => ({ ...f, [field]: value }));
  const reloadAll = () => {
    courses.reload(); // the open-assignment counts change too
    assignments.reload();
  };
  const closeModal = () => setModal(null);
  const saved = () => {
    setModal(null);
    reloadAll();
  };
  const courseDeleted = (id) => {
    if (filters.courseId === id) setFilter('courseId', null);
    saved();
  };

  // The checkbox moves an assignment between "to do" and "submitted".
  async function toggleDone(a) {
    setBusyId(a.id);
    setActionError('');
    try {
      await assignmentsApi.update(a.id, { status: isDone(a.status) ? 'todo' : 'submitted' });
      reloadAll();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const error = courses.error || assignments.error || actionError;
  const items = assignments.items;
  const overdueCount = items.filter((a) => a.overdue).length;
  const selectedCourse = courses.items.find((c) => c.id === filters.courseId);

  return (
    <div className="h-full overflow-y-auto px-4 pb-6 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 py-3">
        <h1 className="flex-1 text-xl font-semibold tracking-tight sm:text-2xl">Courses &amp; assignments</h1>
        <button type="button" onClick={() => setModal({ kind: 'assignment', item: null })} className={primaryButton}>
          + New assignment
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-3 flex items-center gap-3 rounded-md border border-now/40 bg-now/10 px-3 py-2 text-sm"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => {
              setActionError('');
              reloadAll();
            }}
            className="font-medium text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <CoursesPanel
          courses={courses.items}
          loading={courses.loading}
          selectedId={filters.courseId}
          onSelect={(id) => setFilter('courseId', id)}
          onAdd={() => setModal({ kind: 'course', item: null })}
          onEdit={(course) => setModal({ kind: 'course', item: course })}
        />

        <section aria-label="Assignments">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Show" className="flex rounded-md border border-line bg-surface p-0.5">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={filters.status === s.value}
                  onClick={() => setFilter('status', s.value)}
                  className={`h-8 rounded px-3 text-sm font-medium ${
                    filters.status === s.value ? 'bg-accent text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-sm text-muted">
              <span className="sr-only sm:not-sr-only">Priority</span>
              <select
                aria-label="Priority"
                className={selectClass}
                value={filters.priority}
                onChange={(e) => setFilter('priority', e.target.value)}
              >
                <option value="">Any priority</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-sm text-muted">
              <span className="sr-only sm:not-sr-only">Sort by</span>
              <select
                aria-label="Sort by"
                className={selectClass}
                value={filters.sort}
                onChange={(e) => setFilter('sort', e.target.value)}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            {!assignments.loading && (
              <p className="ml-auto text-sm text-muted" aria-live="polite">
                {items.length} {items.length === 1 ? 'assignment' : 'assignments'}
                {selectedCourse ? ` in ${selectedCourse.name}` : ''}
                {overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
              </p>
            )}
          </div>

          {assignments.loading && items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
              {courses.items.length === 0
                ? 'Add a course first, then add assignments to track what is due.'
                : filters.status === 'open' && !filters.priority
                  ? 'Nothing open. Add an assignment, or switch to Done or All to see finished work.'
                  : 'No assignments match these filters.'}
            </div>
          ) : (
            <AssignmentList
              assignments={items}
              busyId={busyId}
              onToggle={toggleDone}
              onEdit={(a) => setModal({ kind: 'assignment', item: a })}
            />
          )}
        </section>
      </div>

      {modal?.kind === 'course' && (
        <CourseModal
          key={modal.item?.id ?? 'new-course'}
          course={modal.item}
          onClose={closeModal}
          onSaved={saved}
          onDeleted={courseDeleted}
        />
      )}
      {modal?.kind === 'assignment' && (
        <AssignmentModal
          key={modal.item?.id ?? 'new-assignment'}
          assignment={modal.item}
          courses={courses.items}
          defaultCourseId={filters.courseId}
          onClose={closeModal}
          onSaved={saved}
        />
      )}
    </div>
  );
}
