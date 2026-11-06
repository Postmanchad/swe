import { useState } from 'react';
import { PRIORITY_DOT, priorityLabel } from '../utils/academic';
import { formatDateOnly, goalStatusLabel, kindLabel, progressLabel, targetTone } from '../utils/goals';
import ProgressBar from './ProgressBar';

const OVERDUE_RED = '#b4233f';

function TaskRow({ task, busy, onToggle, onEdit }) {
  const done = task.status === 'done';
  return (
    <li className="flex items-start gap-3 py-1.5">
      <input
        type="checkbox"
        checked={done}
        disabled={busy}
        onChange={() => onToggle(task)}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
      />
      <button
        type="button"
        onClick={() => onEdit(task)}
        className={`min-w-0 flex-1 truncate text-left text-sm hover:underline ${done ? 'text-muted line-through' : ''}`}
      >
        {task.title}
      </button>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_DOT[task.priority] }} aria-hidden="true" />
        <span className="sr-only">{priorityLabel(task.priority)} priority</span>
      </span>
      {task.due_date && <span className="shrink-0 text-xs text-muted">{formatDateOnly(task.due_date)}</span>}
    </li>
  );
}

export default function GoalCard({ goal, tasks, expanded, busyTaskId, onToggleExpand, onEdit, onAddTask, onToggleTask, onEditTask }) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const tone = targetTone(goal);
  const dateClass = tone === 'overdue' ? 'font-medium' : 'text-muted';
  const inactive = goal.status !== 'active';

  async function handleAdd(e) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setAdding(true);
    const ok = await onAddTask(goal.id, title);
    setAdding(false);
    if (ok) setDraft('');
  }

  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-base font-semibold ${inactive ? 'text-muted' : ''}`}>{goal.title}</h3>
            <span className="rounded border border-line px-1.5 py-0.5 text-xs text-muted">{kindLabel(goal.kind)}</span>
            {inactive && (
              <span className="rounded bg-canvas px-1.5 py-0.5 text-xs font-medium text-ink">{goalStatusLabel(goal.status)}</span>
            )}
          </div>

          {goal.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{goal.description}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {goal.category && <span className="rounded bg-accent-soft px-1.5 py-0.5">{goal.category}</span>}
            <span className="inline-flex items-center gap-1 text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIORITY_DOT[goal.priority] }} aria-hidden="true" />
              {priorityLabel(goal.priority)}
            </span>
            {goal.target_date && (
              <span className={dateClass} style={tone === 'overdue' ? { color: OVERDUE_RED } : undefined}>
                {tone === 'overdue' ? 'Past target · ' : 'Target · '}
                {formatDateOnly(goal.target_date)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label={`Edit ${goal.title}`}
          className="shrink-0 rounded px-2 py-1 text-xs text-muted hover:bg-accent-soft hover:text-ink"
        >
          Edit
        </button>
      </div>

      <div className="mt-3">
        <ProgressBar value={goal.progress} label={`Progress on ${goal.title}`} />
        <p className="mt-1 text-xs text-muted">{progressLabel(goal)}</p>
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => onToggleExpand(goal.id)}
        className="mt-2 rounded px-1 py-0.5 text-sm font-medium text-accent hover:bg-accent-soft"
      >
        {expanded ? 'Hide tasks' : `Tasks (${goal.task_done}/${goal.task_total})`}
      </button>

      {expanded && (
        <div className="mt-2 border-t border-line pt-2">
          {tasks.length === 0 ? (
            <p className="py-2 text-sm text-muted">No tasks yet. Break this goal into small steps below.</p>
          ) : (
            <ul>
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} busy={busyTaskId === t.id} onToggle={onToggleTask} onEdit={onEditTask} />
              ))}
            </ul>
          )}
          <form onSubmit={handleAdd} className="mt-2 flex gap-2">
            <input
              aria-label={`Add a task to ${goal.title}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a task…"
              maxLength={200}
              className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-2 text-sm text-ink"
            />
            <button
              type="submit"
              disabled={adding || !draft.trim()}
              className="h-9 rounded-md border border-line px-3 text-sm font-medium hover:bg-accent-soft disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
