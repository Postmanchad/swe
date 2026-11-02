import { useCallback, useEffect, useMemo, useState } from 'react';
import { auth, getToken, onUnauthorized } from '../api/client.js';
import { AuthContext } from './context.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Restore the session from a stored token.
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    auth
      .me()
      .then((u) => !cancelled && setUser(u))
      .catch(() => {}) // invalid token is cleared by the client; a down server just shows the login page
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // If any request later finds the token expired, drop back to the login page.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  const login = useCallback(async (credentials) => {
    const u = await auth.login(credentials);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (details) => {
    const u = await auth.register(details);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
