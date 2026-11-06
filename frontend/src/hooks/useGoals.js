import { goals as goalsApi, intentions as intentionsApi, tasks as tasksApi } from '../api/client.js';
import useApiList from './useApiList';

// `query` comes from buildGoalQuery().
export function useGoals(query) {
  return useApiList(() => goalsApi.list(query), JSON.stringify(query));
}

// Every task, oldest first. The page groups them under their goals.
export function useTasks() {
  return useApiList(() => tasksApi.list({ sort: 'created', order: 'asc', limit: 500 }), 'tasks');
}

// Intentions for one month, where `month` is a 'YYYY-MM' key.
export function useIntentions(month) {
  return useApiList(() => intentionsApi.list({ month }), `intentions-${month}`);
}
