import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import request from '../api/client';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await request('/users', { token: user.token });
      setUsers(res.data);
    } catch (err) {
      setError(err.message);
    }
  }, [user.token]);

  useEffect(() => { load(); }, [load]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(''); setOk('');
    try {
      await request('/users', { method: 'POST', token: user.token, body: form });
      setOk(`Created ${form.name}`);
      setForm({ name: '', email: '', password: '', role: 'member' });
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page">
      <h1>Team members</h1>
      <p className="muted">Admin-only. Creates the login credentials for a new team member.</p>

      <form onSubmit={onSubmit} className="card inline-form-col">
        <input id="user-name" name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        <input id="user-email" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input id="user-password" type="password" name="password" placeholder="Temporary password" value={form.password} onChange={onChange} required />
        <select id="user-role" name="role" value={form.role} onChange={onChange}>
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
        <button id="user-submit-btn" type="submit">Create user</button>
      </form>
      {error && <p className="error">{error}</p>}
      {ok && <p className="success-text">{ok}</p>}

      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {users.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
