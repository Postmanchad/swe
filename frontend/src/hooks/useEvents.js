import { useCallback, useEffect, useState } from 'react';
import { events as eventsApi } from '../api/client.js';
import { getVisibleRange } from '../utils/events';

// Loads the events visible in the current view. Call reload() after creating, editing or deleting.
export default function useEvents(view, date) {
  const { from, to } = getVisibleRange(view, date);
  const fromMs = from.getTime();
  const toMs = to.getTime();

  const [state, setState] = useState({ events: [], loading: true, error: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    eventsApi
      .list({ from: new Date(fromMs), to: new Date(toMs) })
      .then((list) => {
        if (!cancelled) setState({ events: list, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => {
      cancelled = true; // ignore a slow response from a view the user has already left
    };
  }, [fromMs, toMs, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
