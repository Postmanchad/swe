import { useCallback, useEffect, useState } from 'react';

// Loads a list from the API and reloads when `key` changes or reload() is called.
// `load` must return a promise of an array.
export default function useApiList(load, key) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    load()
      .then((items) => {
        if (!cancelled) setState({ items, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => {
      cancelled = true; // ignore a slow response after the filters changed
    };
  }, [key, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
