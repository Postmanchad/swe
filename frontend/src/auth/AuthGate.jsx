import AuthPage from './AuthPage.jsx';
import { useAuth } from './context.js';

// Shows the login page until the user is signed in, then renders the app with a slim account bar on top.
export default function AuthGate({ children }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!user) return <AuthPage />;

  return (
    <>
      <div className="flex items-center justify-end gap-3 border-b border-gray-200 px-4 py-1.5 text-sm text-gray-600">
        <span>{user.name || user.email}</span>
        <button type="button" onClick={logout} className="rounded px-2 py-0.5 font-medium text-blue-600 hover:bg-blue-50">
          Log out
        </button>
      </div>
      {children}
    </>
  );
}
