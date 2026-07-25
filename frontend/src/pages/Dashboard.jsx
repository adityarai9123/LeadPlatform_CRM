import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import request from '../api/client';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export default function Dashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      if (q) params.set('q', q);
      const res = await request(`/leads?${params.toString()}`, { token: user.token });
      setLeads(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, q, user.token]);

  useEffect(() => { load(1); }, [load]);
  const stats = {
    total: pagination.total,
    new: leads.filter((l) => l.status === "new").length,
    won: leads.filter((l) => l.status === "won").length,
    unassigned: leads.filter((l) => !l.assignedTo).length,
  };

  return (
    <div className="page">
      <h1>Lead Dashboard</h1>
      <p className="muted">
        Manage, track and update customer leads.
      </p>
      <div className="stats-grid">
        <div className="card">
          <h3>Total Leads</h3>
          <h2>{stats.total}</h2>
        </div>

        <div className="card">
          <h3>New (Page)</h3>
          <h2>{stats.new}</h2>
        </div>

        <div className="card">
          <h3>Won (Page)</h3>
          <h2>{stats.won}</h2>
        </div>

        <div className="card">
          <h3>Unassigned (Page)</h3>
          <h2>{stats.unassigned}</h2>
        </div>
      </div>
      <div className="toolbar">
        <input id="search-input" placeholder="Search name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className="card">
          <p>Loading leads...</p>
        </div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Company</th><th>Status</th><th>Assigned to</th><th></th></tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td>{lead.name}</td>
                  <td>{lead.company || '—'}</td>
                  <td><span className={`badge badge-${lead.status}`}>{lead.status}</span></td>
                  <td>{lead.assignedTo?.name || 'Unassigned'}</td>
                  <td><Link to={`/leads/${lead._id}`}>Open</Link></td>
                </tr>
              ))}
              {leads.length === 0 && <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>
                    <div>
                      <h3>No Leads Found</h3>
                      <p className="muted">
                        Try changing your search or filter.
                      </p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <div className="pager">
            <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Prev</button>
            <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
