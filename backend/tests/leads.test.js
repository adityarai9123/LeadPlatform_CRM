require('./setup');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

const loginAs = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.data.token;
};

describe('Core flow 1: public capture -> admin assigns -> member works the lead', () => {
  let admin, member, adminToken, memberToken;

  beforeEach(async () => {
    admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password1', role: 'admin' });
    member = await User.create({ name: 'Member', email: 'member@test.com', password: 'password1', role: 'member' });
    adminToken = await loginAs('admin@test.com', 'password1');
    memberToken = await loginAs('member@test.com', 'password1');
  });

  test('anyone can submit the public capture form without auth', async () => {
    const res = await request(app)
      .post('/api/leads/capture')
      .send({ name: 'Jane Prospect', email: 'jane@prospect.com', company: 'Acme Co' });
    expect(res.status).toBe(201);
  });

  test('capture form rejects missing required fields', async () => {
    const res = await request(app).post('/api/leads/capture').send({ name: 'No Email' });
    expect(res.status).toBe(400);
  });

  test('full lifecycle: capture, list with pagination, admin assigns, member updates status and adds a note', async () => {
    const capture = await request(app)
      .post('/api/leads/capture')
      .send({ name: 'Jane Prospect', email: 'jane@prospect.com', company: 'Acme Co' });
    const leadId = capture.body.data.id;

    const list = await request(app).get('/api/leads?page=1&limit=10').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.pagination.total).toBe(1);

    const assign = await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: member._id.toString() });
    expect(assign.status).toBe(200);
    expect(assign.body.data.assignedTo).toBe(member._id.toString());

    const status = await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'contacted' });
    expect(status.status).toBe(200);
    expect(status.body.data.status).toBe('contacted');

    const note = await request(app)
      .post(`/api/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ text: 'Left a voicemail' });
    expect(note.status).toBe(201);
    expect(note.body.data.notes.length).toBe(1);

    const detail = await request(app).get(`/api/leads/${leadId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(detail.body.data.activity.length).toBeGreaterThanOrEqual(3); // created, assigned, status_changed, note_added
  });

  test('rejects an invalid status value', async () => {
    const capture = await request(app)
      .post('/api/leads/capture')
      .send({ name: 'Jane', email: 'jane@x.com' });
    const leadId = capture.body.data.id;

    const res = await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'not_a_real_status' });
    expect(res.status).toBe(400);
  });
});

describe('Core flow 2: permission boundary - a member cannot touch a lead not assigned to them', () => {
  let member, otherMember, memberToken;

  beforeEach(async () => {
    member = await User.create({ name: 'Member A', email: 'a@test.com', password: 'password1', role: 'member' });
    otherMember = await User.create({ name: 'Member B', email: 'b@test.com', password: 'password1', role: 'member' });
    memberToken = await loginAs('a@test.com', 'password1');
  });

  test('member is blocked from updating status on an unassigned lead', async () => {
    const capture = await request(app)
      .post('/api/leads/capture')
      .send({ name: 'Unassigned Lead', email: 'lead@x.com' });
    const leadId = capture.body.data.id;

    const res = await request(app)
      .patch(`/api/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'contacted' });
    expect(res.status).toBe(403);
  });

  test('member cannot assign leads (admin-only route)', async () => {
    const capture = await request(app).post('/api/leads/capture').send({ name: 'L', email: 'l@x.com' });
    const leadId = capture.body.data.id;

    const res = await request(app)
      .patch(`/api/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ userId: otherMember._id.toString() });
    expect(res.status).toBe(403);
  });

  test('member cannot delete leads (admin-only route)', async () => {
    const capture = await request(app).post('/api/leads/capture').send({ name: 'L', email: 'l@x.com' });
    const leadId = capture.body.data.id;

    const res = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });
});
