const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const Startup = require('../models/Startup');
const StartupApplication = require('../models/StartupApplication');
const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const ProfileView = require('../models/ProfileView');
const { recalculateForUser } = require('../services/matchingEngine');
const { DEMO_PASSWORD, demoProfile, founders, startups } = require('./demoData');

function participantKey(a, b) {
  return [a.toString(), b.toString()].sort().join(':');
}

async function clearDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Startup.deleteMany({}),
    StartupApplication.deleteMany({}),
    Connection.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Match.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
    ProfileView.deleteMany({}),
  ]);
}

async function seedDatabase({ force = false } = {}) {
  const existingUsers = await User.countDocuments({});
  if (existingUsers > 0 && !force) {
    return { skipped: true, users: existingUsers };
  }

  if (force) await clearDatabase();

  const admin = await User.create({
    name: 'CoFoundr Admin',
    email: config.admin.email,
    password: config.admin.password,
    role: 'admin',
    category: 'Other',
    location: 'Remote',
    bio: 'Platform administrator for CoFoundr AI.',
    onboardingCompleted: true,
    isActive: true,
  });

  const demo = await User.create({
    ...demoProfile,
    password: DEMO_PASSWORD,
    onboardingCompleted: true,
    isActive: true,
  });

  const createdFounders = {};
  for (const founder of founders) {
    const user = await User.create({
      ...founder,
      password: DEMO_PASSWORD,
      onboardingCompleted: true,
      isActive: true,
    });
    createdFounders[founder.email] = user;
  }

  const allUsers = { 'demo@cofoundr.ai': demo, ...createdFounders };

  const createdStartups = {};
  for (const startup of startups) {
    const founder = allUsers[startup.founderEmail];
    if (!founder) continue;
    const created = await Startup.create({
      ...startup,
      founderId: founder._id,
      lookingForCollaborators: true,
      isActive: true,
    });
    createdStartups[startup.title] = created;
  }

  const connect = async (aEmail, bEmail, status = 'accepted') => {
    const a = allUsers[aEmail];
    const b = allUsers[bEmail];
    if (!a || !b) return null;
    return Connection.create({ senderId: a._id, receiverId: b._id, status });
  };

  await connect('demo@cofoundr.ai', 'sofia@cofoundr.ai');
  await connect('priya@cofoundr.ai', 'demo@cofoundr.ai');
  await connect('daniel@cofoundr.ai', 'demo@cofoundr.ai', 'pending');
  await connect('demo@cofoundr.ai', 'rohan@cofoundr.ai', 'pending');
  await connect('sofia@cofoundr.ai', 'mei@cofoundr.ai');
  await connect('lucas@cofoundr.ai', 'daniel@cofoundr.ai');
  await connect('emma@cofoundr.ai', 'rohan@cofoundr.ai');
  await connect('noah@cofoundr.ai', 'mei@cofoundr.ai', 'pending');

  const createConversation = async (emailA, emailB, entries) => {
    const a = allUsers[emailA];
    const b = allUsers[emailB];
    if (!a || !b) return;
    const participants = [a._id, b._id].sort((x, y) => x.toString().localeCompare(y.toString()));
    const last = entries[entries.length - 1];
    const baseTime = Date.now() - entries.length * 6 * 60 * 1000;
    const conversation = await Conversation.create({
      participants,
      participantKey: participantKey(a._id, b._id),
      lastMessage: last.content,
      lastMessageAt: new Date(baseTime + (entries.length - 1) * 6 * 60 * 1000),
      lastSenderId: allUsers[last.senderEmail]._id,
    });

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const createdAt = new Date(baseTime + index * 6 * 60 * 1000);
      await Message.create({
        senderId: allUsers[entry.senderEmail]._id,
        receiverId: allUsers[entry.receiverEmail]._id,
        conversationId: conversation._id,
        content: entry.content,
        readAt: entry.read ? new Date(createdAt.getTime() + 60 * 1000) : null,
        createdAt,
        updatedAt: createdAt,
      });
    }
  };

  await createConversation('demo@cofoundr.ai', 'sofia@cofoundr.ai', [
    {
      senderEmail: 'demo@cofoundr.ai',
      receiverEmail: 'sofia@cofoundr.ai',
      content:
        'Hi Sofia — I saw your growth work with B2B SaaS. I am building Nexa, an AI copilot for first-time founders.',
      read: true,
    },
    {
      senderEmail: 'sofia@cofoundr.ai',
      receiverEmail: 'demo@cofoundr.ai',
      content:
        'Hey Alex! That sounds close to a problem I keep hearing about. What stage are you at?',
      read: true,
    },
    {
      senderEmail: 'demo@cofoundr.ai',
      receiverEmail: 'sofia@cofoundr.ai',
      content:
        'We have an MVP and a handful of design partners. The gap is a commercial co-founder who loves customer research.',
      read: true,
    },
    {
      senderEmail: 'sofia@cofoundr.ai',
      receiverEmail: 'demo@cofoundr.ai',
      content: 'That is exactly the kind of problem I want to work on. Want to jump on a call this week?',
      read: false,
    },
  ]);

  await createConversation('demo@cofoundr.ai', 'priya@cofoundr.ai', [
    {
      senderEmail: 'priya@cofoundr.ai',
      receiverEmail: 'demo@cofoundr.ai',
      content:
        'Alex, your background looks relevant to GreenLedger. Are you open to a quick conversation about the technical side?',
      read: true,
    },
    {
      senderEmail: 'demo@cofoundr.ai',
      receiverEmail: 'priya@cofoundr.ai',
      content: 'Definitely. I am especially curious about your distribution plan for community lenders.',
      read: true,
    },
    {
      senderEmail: 'priya@cofoundr.ai',
      receiverEmail: 'demo@cofoundr.ai',
      content: 'I will send over a short deck tonight. It is still rough, but the customer interviews are strong.',
      read: false,
    },
  ]);

  if (createdStartups.Nexa && allUsers['amara@cofoundr.ai']) {
    await StartupApplication.create({
      startupId: createdStartups.Nexa._id,
      applicantId: allUsers['amara@cofoundr.ai']._id,
      message:
        'I am a CS student building in EdTech and would love to help with growth experiments and user research for Nexa.',
      status: 'pending',
    });
  }

  if (createdStartups.MediSync && allUsers['lucas@cofoundr.ai']) {
    await StartupApplication.create({
      startupId: createdStartups.MediSync._id,
      applicantId: allUsers['lucas@cofoundr.ai']._id,
      message:
        'My ML background is in medical imaging and I would love to explore the data side of MediSync.',
      status: 'pending',
    });
  }

  await Notification.insertMany([
    {
      userId: demo._id,
      type: 'connection_request',
      message: 'Daniel Kim wants to connect with you',
      relatedUserId: allUsers['daniel@cofoundr.ai']._id,
      link: '/connections',
      isRead: false,
    },
    {
      userId: demo._id,
      type: 'startup_application',
      message: 'Amara Okafor applied to join Nexa',
      relatedUserId: allUsers['amara@cofoundr.ai']._id,
      relatedStartupId: createdStartups.Nexa?._id,
      link: createdStartups.Nexa ? `/startups/${createdStartups.Nexa._id}` : '/startups',
      isRead: false,
    },
    {
      userId: demo._id,
      type: 'system',
      message: 'Welcome to CoFoundr AI! Complete your profile to get sharper matches.',
      link: '/profile/edit',
      isRead: true,
    },
  ]);

  await recalculateForUser(demo._id, { limit: 20 });

  return {
    skipped: false,
    admin: admin.email,
    demo: demo.email,
    users: 1 + 1 + Object.keys(createdFounders).length,
    startups: Object.keys(createdStartups).length,
    password: DEMO_PASSWORD,
  };
}

async function autoSeed() {
  if (config.isProd) return { skipped: true };
  const result = await seedDatabase({ force: false });
  if (!result.skipped) {
    console.log(
      `[seed] Demo data ready — login: ${result.demo} / ${DEMO_PASSWORD} | admin: ${result.admin}`
    );
  }
  return result;
}

if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  const force = process.argv.includes('--force');
  connectDB()
    .then(async () => {
      const result = await seedDatabase({ force });
      console.log('[seed] Result:', JSON.stringify(result, null, 2));
      await disconnectDB();
      if (result.skipped) {
        console.log(
          '[seed] Database already contains users. Use "npm run seed -- --force" to reset demo data.'
        );
      }
      await mongoose.connection.close().catch(() => {});
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('[seed] Failed:', error);
      await disconnectDB().catch(() => {});
      process.exit(1);
    });
}

module.exports = { seedDatabase, autoSeed };
