import { useState } from 'react';
import request from '../api/client';

export default function CaptureForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await request('/leads/capture', { method: 'POST', body: form });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="page-narrow">
      <h1>Talk to our sales team</h1>
      <p className="muted">Tell us a bit about you and we'll get back to you shortly.</p>

      {status === 'success' ? (
        <div className="card success">Thanks — we've received your details and will reach out soon.</div>
      ) : (
        <form onSubmit={onSubmit} className="card">
          <label htmlFor="capture-name">Full name *</label>
          <input id="capture-name" name="name" required value={form.name} onChange={onChange} />
          
          <label htmlFor="capture-email">Email *</label>
          <input id="capture-email" type="email" name="email" required value={form.email} onChange={onChange} />
          
          <label htmlFor="capture-phone">Phone</label>
          <input id="capture-phone" name="phone" value={form.phone} onChange={onChange} />
          
          <label htmlFor="capture-company">Company</label>
          <input id="capture-company" name="company" value={form.company} onChange={onChange} />
          
          <label htmlFor="capture-message">Message</label>
          <textarea id="capture-message" name="message" rows="3" value={form.message} onChange={onChange} />
          
          {error && <p className="error">{error}</p>}
          <button id="capture-submit-btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
}
