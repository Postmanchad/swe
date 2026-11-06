import { useMemo, useState } from 'react';
import { tasks as tasksApi } from '../api/client.js';
import GoalCard from '../components/GoalCard';
import GoalModal from '../components/GoalModal';
import IntentionsPanel from '../components/IntentionsPanel';
import TaskModal from '../components/TaskModal';
import { primaryButton } from '../components/formStyles';
import { useGoals, useTasks } from '../hooks/useGoals';
import { GOAL_SORTS, GOAL_STATUS_FILTERS, KIND_FILTERS, buildGoalQuery, groupTasksByGoal } from '../utils/goals';

const selectClass = 'h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink';

function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-md border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 rounded px-3 text-sm font-medium ${value === o.value ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function GoalsPage() {
  const [filters, setFilters] = useState({ kind: 'all', status: 'active', sort: 'target' });
  const [modal, setModal] = useState(null); // { kind: 'goal' | 'task', item: record | null }
  const [expanded, setExpanded] = useState(() => new Set());
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [actionError, setActionError] = useState('');

  const goals = useGoals(buildGoalQuery(filters));
  const tasks = useTasks();
  const tasksByGoal = useMemo(() => groupTasksByGoal(tasks.items), [tasks.items]);

  const setFilter = (field, value) => setFilters((f) => ({ ...f, [field]: value }));
  const reloadAll = () => {
    goals.reload(); // progress bars come from the tasks
    tasks.reload();
  };
  const saved = () => {
    setModal(null);
    reloadAll();
  };
  const toggleExpanded = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // The checkbox moves a task between "to do" and "done".
  async function toggleTask(task) {
    setBusyTaskId(task.id);
    setActionError('');
    try {
      await tasksApi.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
      reloadAll();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyTaskId(null);
    }
  }

  // Returns true when the task was created, so the card can clear its input.
  async function addTask(goalId, title) {
    setActionError('');
    try {
      await tasksApi.create({ title, goal_id: goalId });
      reloadAll();
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  }

  const error = goals.error || tasks.error || actionError;
  const items = goals.items;
  const defaultKind = filters.kind === 'all' ? 'short_term' : filters.kind;

  return (
    <div className="h-full overflow-y-auto px-4 pb-6 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 py-3">
        <h1 className="flex-1 text-xl font-semibold tracking-tight sm:text-2xl">Goals</h1>
        <button type="button" onClick={() => setModal({ kind: 'goal', item: null })} className={primaryButton}>
          + New goal
        </button>
      </header>

      {error && (
        <div role="alert" className="mb-3 flex items-center gap-3 rounded-md border border-now/40 bg-now/10 px-3 py-2 text-sm">
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

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Goals">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Segmented label="Goal type" options={KIND_FILTERS} value={filters.kind} onChange={(v) => setFilter('kind', v)} />

            <label className="flex items-center gap-1.5 text-sm text-muted">
              <span className="sr-only sm:not-sr-only">Show</span>
              <select aria-label="Status" className={selectClass} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                {GOAL_STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-sm text-muted">
              <span className="sr-only sm:not-sr-only">Sort by</span>
              <select aria-label="Sort by" className={selectClass} value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
                {GOAL_SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {goals.loading && items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-10 text-center text-sm text-muted">
              {filters.kind === 'all' && filters.status === 'active'
                ? 'No goals yet. Add one, then break it into small tasks to watch the progress bar fill.'
                : 'No goals match these filters.'}
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  tasks={tasksByGoal.get(goal.id) ?? []}
                  expanded={expanded.has(goal.id)}
                  busyTaskId={busyTaskId}
                  onToggleExpand={toggleExpanded}
                  onEdit={(g) => setModal({ kind: 'goal', item: g })}
                  onAddTask={addTask}
                  onToggleTask={toggleTask}
                  onEditTask={(t) => setModal({ kind: 'task', item: t })}
                />
              ))}
            </ul>
          )}
        </section>

        <IntentionsPanel />
      </div>

      {modal?.kind === 'goal' && (
        <GoalModal
          key={modal.item?.id ?? 'new-goal'}
          goal={modal.item}
          defaultKind={defaultKind}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}
      {modal?.kind === 'task' && (
        <TaskModal
          key={modal.item?.id ?? 'new-task'}
          task={modal.item}
          goals={items}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
