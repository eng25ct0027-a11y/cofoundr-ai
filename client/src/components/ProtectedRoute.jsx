import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="boot-screen">
        <Spinner label="Loading your workspace…" full />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return (
      <div className="boot-screen">
        <Spinner label="Loading…" full />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={user?.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />;
  }
  return children;
}

export function OnboardingGuard({ children }) {
  const { user } = useAuth();
  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
