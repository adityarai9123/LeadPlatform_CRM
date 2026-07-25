import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="nav">
      <Link to="/" className="brand">LeadPlatform</Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard">Leads</Link>
            {user.role === 'admin' && <Link to="/admin/users">Team</Link>}
            <span className="small muted">{user.name} ({user.role})</span>
            <button className="link-btn" onClick={() => { logout(); navigate('/login'); }}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/">Capture form</Link>
            <Link to="/login">Sign in</Link>
          </>
        )}
      </div>
    </nav>
  );
}
