import { Link } from 'react-router-dom';
import AdvisorChat from '../features/advisor/AdvisorChat.jsx';
import { useAuthStore } from '../store/authStore.js';

export default function AdvisorPage() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-divider h-16 flex items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-extrabold text-lg text-primary">
            <span className="text-airtel-red">Airtel</span> Udyam One
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          {isAuthenticated ? (
            <>
              <span className="text-secondary hidden sm:inline">
                {user?.phoneLast4 ? `••••${user.phoneLast4}` : user?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-secondary py-1.5 px-3 text-xs">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0">
        <h1 className="sr-only">Airtel AI Connectivity Advisor</h1>
        <AdvisorChat />
      </main>
    </div>
  );
}
