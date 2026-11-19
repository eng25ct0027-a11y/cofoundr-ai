const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const User = require('../models/User');
const { startTestDb, stopTestDb, clearTestDb } = require('./helpers/testDb');

const PASSWORD = 'Password123!';

before(async () => {
  await startTestDb();
});

after(async () => {
  await stopTestDb();
});

async function registerAgent(email, name) {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/register')
    .send({ name, email, password: PASSWORD, confirmPassword: PASSWORD });
  assert.equal(res.status, 201);
  // Connection, messaging and matching flows only consider onboarded founders.
  await User.updateOne({ _id: res.body.data.user._id }, { $set: { onboardingCompleted: true } });
  return { agent, id: res.body.data.user._id, name };
}

async function loginAgent(email) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(res.status, 200);
  return { agent, id: res.body.data.user._id, name: res.body.data.user.name };
}

test('connection requests can be sent, listed, and accepted', async () => {
  await clearTestDb();
  const alice = await registerAgent('alice@example.com', 'Alice Founder');
  const bob = await registerAgent('bob@example.com', 'Bob Builder');

  const sent = await alice.agent
    .post('/api/connections/request')
    .send({ receiverId: bob.id });
  assert.equal(sent.status, 201);
  assert.equal(sent.body.data.connection.status, 'pending');
  assert.equal(sent.body.data.autoAccepted, false);
  const connectionId = sent.body.data.connection._id;

  const duplicate = await alice.agent
    .post('/api/connections/request')
    .send({ receiverId: bob.id });
  assert.equal(duplicate.status, 409);

  const incoming = await bob.agent.get('/api/connections?status=pending');
  assert.equal(incoming.status, 200);
  assert.equal(incoming.body.data.counts.received, 1);
  assert.equal(incoming.body.data.connections[0].direction, 'incoming');
  assert.equal(incoming.body.data.connections[0].user._id, alice.id);

  const accepted = await bob.agent.put(`/api/connections/${connectionId}/accept`);
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.data.connection.status, 'accepted');

  const acceptedList = await alice.agent.get('/api/connections?status=accepted');
  assert.equal(acceptedList.status, 200);
  assert.equal(acceptedList.body.data.counts.accepted, 1);
  assert.equal(acceptedList.body.data.connections[0].user._id, bob.id);

  const again = await alice.agent
    .post('/api/connections/request')
    .send({ receiverId: bob.id });
  assert.equal(again.status, 409);
});

test('messaging requires an accepted connection and tracks unread state', async () => {
  const alice = await loginAgent('alice@example.com');
  const bob = await loginAgent('bob@example.com');
  const carol = await registerAgent('carol@example.com', 'Carol Coder');

  const blocked = await carol.agent.post('/api/conversations').send({ userId: bob.id });
  assert.equal(blocked.status, 403);

  const conversation = await alice.agent
    .post('/api/conversations')
    .send({ userId: bob.id });
  assert.equal(conversation.status, 200);
  const conversationId = conversation.body.data.conversation._id;

  const message = await alice.agent
    .post('/api/messages')
    .send({ conversationId, content: 'Hey Bob, want to compare notes on the MVP?' });
  assert.equal(message.status, 201);
  assert.equal(message.body.data.conversationId, conversationId);

  const bobInbox = await bob.agent.get('/api/conversations');
  assert.equal(bobInbox.status, 200);
  assert.equal(bobInbox.body.data.unreadTotal, 1);
  assert.equal(bobInbox.body.data.conversations[0].user._id, alice.id);

  const history = await bob.agent.get(`/api/messages/${conversationId}`);
  assert.equal(history.status, 200);
  assert.equal(history.body.data.messages.length, 1);
  assert.equal(history.body.data.messages[0].content, message.body.data.message.content);

  const afterRead = await bob.agent.get('/api/conversations');
  assert.equal(afterRead.body.data.unreadTotal, 0);
});

test('saving a profile toggles it in the saved-profiles search', async () => {
  const alice = await loginAgent('alice@example.com');
  const bob = await loginAgent('bob@example.com');

  const saved = await alice.agent.put(`/api/users/${bob.id}/save`);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.data.saved, true);

  const savedList = await alice.agent.get('/api/users?saved=true');
  assert.equal(savedList.status, 200);
  assert.ok(savedList.body.data.users.some((user) => user._id === bob.id));
  assert.ok(savedList.body.data.users.every((user) => user._id !== alice.id));

  const removed = await alice.agent.put(`/api/users/${bob.id}/save`);
  assert.equal(removed.body.data.saved, false);

  const emptyList = await alice.agent.get('/api/users?saved=true');
  assert.equal(emptyList.body.data.users.length, 0);
});

test('startup applications notify the founder and can be reviewed', async () => {
  const alice = await loginAgent('alice@example.com');
  const bob = await loginAgent('bob@example.com');

  const created = await alice.agent.post('/api/startups').send({
    title: 'Nexa Labs',
    description:
      'An AI copilot that helps first-time founders turn customer interviews into a focused roadmap.',
    problem: 'Early founders drown in unstructured customer research and lose momentum.',
    solution: 'Structured interview synthesis with weekly, evidence-backed next actions.',
    industry: 'AI',
    requiredSkills: ['React.js', 'AI/ML'],
    requiredRoles: ['Developer'],
    projectStage: 'MVP',
    teamSize: 2,
  });
  assert.equal(created.status, 201);
  const startupId = created.body.data.startup._id;

  const applied = await bob.agent
    .post(`/api/startups/${startupId}/apply`)
    .send({ message: 'I can own the frontend and help with design partners.' });
  assert.equal(applied.status, 201);
  const applicationId = applied.body.data.application._id;

  const duplicate = await bob.agent
    .post(`/api/startups/${startupId}/apply`)
    .send({ message: 'Applying twice.' });
  assert.equal(duplicate.status, 409);

  const forbidden = await bob.agent.get(`/api/startups/${startupId}/applications`);
  assert.equal(forbidden.status, 403);

  const applications = await alice.agent.get(`/api/startups/${startupId}/applications`);
  assert.equal(applications.status, 200);
  assert.equal(applications.body.data.applications.length, 1);
  assert.equal(applications.body.data.applications[0].applicantId._id, bob.id);

  const reviewed = await alice.agent
    .put(`/api/startups/applications/${applicationId}`)
    .send({ action: 'accept' });
  assert.equal(reviewed.status, 200);
  assert.equal(reviewed.body.data.application.status, 'accepted');

  const notifications = await bob.agent.get('/api/notifications');
  assert.equal(notifications.status, 200);
  assert.ok(
    notifications.body.data.notifications.some(
      (notification) => notification.type === 'application_accepted'
    )
  );

  const connections = await bob.agent.get('/api/connections?status=accepted');
  assert.ok(connections.body.data.connections.some((item) => item.user._id === alice.id));
});

test('removing an accepted connection also removes its conversation', async () => {
  const alice = await loginAgent('alice@example.com');
  const bob = await loginAgent('bob@example.com');

  const connections = await alice.agent.get('/api/connections?status=accepted');
  const withBob = connections.body.data.connections.find((item) => item.user._id === bob.id);
  assert.ok(withBob);

  const removed = await alice.agent.delete(`/api/connections/${withBob._id}`);
  assert.equal(removed.status, 200);

  const inbox = await bob.agent.get('/api/conversations');
  assert.ok(!inbox.body.data.conversations.some((item) => item.user?._id === alice.id));
});
