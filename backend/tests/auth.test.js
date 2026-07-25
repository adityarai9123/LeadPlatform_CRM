require('./setup');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth rules', () => {
  beforeEach(async () => {
    await User.create([
      { name: 'Admin', email: 'admin@test.com', password: 'password1', role: 'admin' },
      { name: 'Member', email: 'member@test.com', password: 'password1', role: 'member' },
    ]);
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password1' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe('admin');
  });

  test('blocks access to protected route without a token', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  test('blocks a member from creating users (admin-only route)', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: 'password1' });
    const token = login.body.data.token;

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New', email: 'new@test.com', password: 'password1' });

    expect(res.status).toBe(403);
  });

  test('allows admin to create a new user', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password1' });
    const token = login.body.data.token;

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New', email: 'new@test.com', password: 'password1', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('member');
  });
});
