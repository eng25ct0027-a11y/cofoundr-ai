const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');

// Load server/.env first so MONGOMS_VERSION is honoured by mongodb-memory-server.
require('../../config/env');

const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;
let dataDir = null;

async function startTestDb() {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cofoundr-test-'));
  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'cofoundr_test',
      dbPath: dataDir,
      storageEngine: 'wiredTiger',
      launchTimeout: 60000,
    },
    cleanup: { doCleanup: true },
  });

  mongoose.set('strictQuery', true);
  await mongoose.connect(memoryServer.getUri('cofoundr_test'), {
    serverSelectionTimeoutMS: 20000,
  });
  return mongoose.connection;
}

async function stopTestDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  if (dataDir) {
    fs.rmSync(dataDir, { recursive: true, force: true });
    dataDir = null;
  }
}

async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

module.exports = { startTestDb, stopTestDb, clearTestDb };
