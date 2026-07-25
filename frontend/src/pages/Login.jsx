import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-narrow">
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} className="card">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button id="login-submit-btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="muted small">Demo: admin@leadplatform.dev / Admin@1234 &middot; member@leadplatform.dev / Member@1234</p>
    </div>
  );
}
