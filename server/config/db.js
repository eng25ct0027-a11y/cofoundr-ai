const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const config = require('./env');

let memoryServer = null;

async function connectDB() {
  let uri = config.mongoUri;

  if (!uri) {
    if (!config.useMemoryMongo) {
      throw new Error(
        'No MONGODB_URI provided and USE_MEMORY_MONGO is disabled. Set MONGODB_URI in server/.env.'
      );
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '..', '.mongo-data');
    fs.mkdirSync(dbPath, { recursive: true });
    console.log('[db] No MONGODB_URI set — starting a local MongoDB instance...');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'cofoundr_ai',
        dbPath,
        storageEngine: 'wiredTiger',
        launchTimeout: 60000,
      },
      cleanup: { doCleanup: false },
    });
    uri = memoryServer.getUri('cofoundr_ai');
    console.log('[db] Local MongoDB ready (data persisted in server/.mongo-data)');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log(`[db] Connected to MongoDB database "${mongoose.connection.name}"`);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
