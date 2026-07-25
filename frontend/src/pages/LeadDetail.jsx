import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import request from '../api/client';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export default function LeadDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await request(`/leads/${id}`, { token: user.token });
    setLead(res.data);
  }, [id, user.token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user.role === 'admin') {
      request('/users', { token: user.token }).then((res) => setUsers(res.data)).catch(() => {});
    }
  }, [user]);

  // Client-side permission check mirrors the server rule: a member can only
  // act on leads assigned to them. This just controls the UI - the API is
  // the real enforcement point (see backend/middleware/auth.js).
  const canModify = lead && (user.role === 'admin' || lead.assignedTo?._id === user._id);

  const updateStatus = async (status) => {
    setError('');
    try {
      await request(`/leads/${id}/status`, { method: 'PATCH', token: user.token, body: { status } });
      load();
    } catch (err) { setError(err.message); }
  };

  const assign = async (userId) => {
    setError('');
    try {
      await request(`/leads/${id}/assign`, { method: 'PATCH', token: user.token, body: { userId: userId || null } });
      load();
    } catch (err) { setError(err.message); }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setError('');
    try {
      await request(`/leads/${id}/notes`, { method: 'POST', token: user.token, body: { text: note } });
      setNote('');
      load();
    } catch (err) { setError(err.message); }
  };

  if (!lead) return <div className="page">Loading…</div>;

  return (
    <div className="page">
      <Link to="/dashboard">&larr; Back to leads</Link>
      <h1>{lead.name}</h1>
      <p className="muted">{lead.email} {lead.phone && `· ${lead.phone}`} {lead.company && `· ${lead.company}`}</p>
      {error && <p className="error">{error}</p>}

      <div className="grid">
        <div className="card">
          <h3>Status</h3>
          <div className="pill-row">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`pill ${lead.status === s ? 'pill-active' : ''}`}
                disabled={!canModify}
                onClick={() => updateStatus(s)}
              >{s}</button>
            ))}
          </div>
          {!canModify && <p className="small muted">Only an admin, or the member this lead is assigned to, can change status.</p>}
        </div>

        {user.role === 'admin' && (
          <div className="card">
            <h3>Assignment</h3>
            <select value={lead.assignedTo?._id || ''} onChange={(e) => assign(e.target.value)}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
        )}

        <div className="card">
          <h3>Notes</h3>
          <ul className="notes">
            {lead.notes.map((n) => (
              <li key={n._id}><strong>{n.author?.name || 'Unknown'}:</strong> {n.text}
                <span className="small muted"> — {new Date(n.createdAt).toLocaleString()}</span></li>
            ))}
            {lead.notes.length === 0 && <li className="muted">No notes yet.</li>}
          </ul>
          {canModify && (
            <form onSubmit={addNote} className="inline-form">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
              <button type="submit">Add</button>
            </form>
          )}
        </div>

        <div className="card">
          <h3>Activity trail</h3>
          <ul className="activity">
            {lead.activity.map((a) => (
              <li key={a._id}>
                <span className="small muted">{new Date(a.createdAt).toLocaleString()}</span> — {a.action}
                {a.detail && <> ({a.detail})</>} {a.actor?.name && <>by {a.actor.name}</>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
