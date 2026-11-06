import { assignments as assignmentsApi, courses as coursesApi } from '../api/client.js';
import { withDueDate } from '../utils/academic';
import useApiList from './useApiList';

export function useCourses() {
  return useApiList(() => coursesApi.list(), 'courses');
}

// `query` comes from buildAssignmentQuery().
export function useAssignments(query) {
  return useApiList(
    () => assignmentsApi.list(query).then((rows) => rows.map(withDueDate)),
    JSON.stringify(query),
  );
}
