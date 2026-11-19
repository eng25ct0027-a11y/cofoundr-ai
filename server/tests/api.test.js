const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const { startTestDb, stopTestDb, clearTestDb } = require('./helpers/testDb');

const PASSWORD = 'Password123!';

before(async () => {
  await startTestDb();
});

after(async () => {
  await stopTestDb();
});

function register(agent, email, name = 'Test Founder') {
  return agent
    .post('/api/auth/register')
    .send({ name, email, password: PASSWORD, confirmPassword: PASSWORD });
}

test('health endpoint reports a connected database', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.database, 'connected');
});

test('registration validates input and creates an authenticated account', async () => {
  await clearTestDb();
  const agent = request.agent(app);

  const invalid = await agent
    .post('/api/auth/register')
    .send({ name: 'A', email: 'not-an-email', password: 'short' });
  assert.equal(invalid.status, 422);
  assert.equal(invalid.body.success, false);

  const created = await register(agent, 'founder@example.com', 'Ada Founder');
  assert.equal(created.status, 201);
  assert.equal(created.body.success, true);
  assert.ok(created.body.data.user._id);
  assert.equal(created.body.data.user.password, undefined);

  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, 'founder@example.com');
});

test('duplicate registration is rejected', async () => {
  const agent = request.agent(app);
  const duplicate = await register(agent, 'founder@example.com');
  assert.equal(duplicate.status, 409);
});

test('login rejects wrong credentials and accepts the right ones', async () => {
  const agent = request.agent(app);

  const wrong = await agent
    .post('/api/auth/login')
    .send({ email: 'founder@example.com', password: 'WrongPassword1!' });
  assert.equal(wrong.status, 401);

  const ok = await agent
    .post('/api/auth/login')
    .send({ email: 'founder@example.com', password: PASSWORD });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.user.password, undefined);
});

test('protected routes require authentication', async () => {
  const res = await request(app).get('/api/dashboard');
  assert.equal(res.status, 401);
});

test('authenticated founders can load their dashboard and profile', async () => {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ email: 'founder@example.com', password: PASSWORD });

  const dashboard = await agent.get('/api/dashboard');
  assert.equal(dashboard.status, 200);
  assert.ok(dashboard.body.data.user);

  const me = await agent.get('/api/auth/me');
  const id = me.body.data.user._id;

  const profile = await agent.get(`/api/users/${id}`);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.data.user._id, id);
});

test('other founder profiles hide email addresses', async () => {
  const secondAgent = request.agent(app);
  const second = await register(secondAgent, 'second@example.com', 'Grace Founder');
  assert.equal(second.status, 201);
  const secondId = second.body.data.user._id;

  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ email: 'founder@example.com', password: PASSWORD });

  const profile = await agent.get(`/api/users/${secondId}`);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.data.user.email, undefined);
  assert.equal(profile.body.data.user.compatibility.compatibilityScore >= 0, true);
});

test('validation errors use the 422 contract', async () => {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ email: 'founder@example.com', password: PASSWORD });

  const connection = await agent
    .post('/api/connections/request')
    .send({ receiverId: 'not-a-mongo-id' });
  assert.equal(connection.status, 422);

  const startup = await agent.post('/api/startups').send({ title: 'x' });
  assert.equal(startup.status, 422);
});

test('admin routes are closed to regular founders', async () => {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ email: 'founder@example.com', password: PASSWORD });

  const res = await agent.get('/api/admin/stats');
  assert.equal(res.status, 403);
});

test('unknown API routes return a structured 404', async () => {
  const res = await request(app).get('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
