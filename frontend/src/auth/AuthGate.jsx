import AuthPage from './AuthPage.jsx';
import { useAuth } from './context.js';

// Shows the login page until the user is signed in, then renders the app under a slim account bar.
// The wrapper is a flex column so the calendar fills exactly the space left below the bar.
export default function AuthGate({ children }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>;
  }
  if (!user) return <AuthPage />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end gap-3 border-b border-line bg-surface px-4 py-1.5 text-sm text-muted">
        <span>{user.name || user.email}</span>
        <button
          type="button"
          onClick={logout}
          className="rounded px-2 py-0.5 font-medium text-accent hover:bg-accent-soft"
        >
          Log out
        </button>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
