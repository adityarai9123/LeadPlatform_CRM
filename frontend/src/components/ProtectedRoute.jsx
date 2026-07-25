import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Client-side gate for UX only (avoids flashing protected pages to logged-out
// users). The real enforcement happens server-side in backend/middleware/auth.js.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
