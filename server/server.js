const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./sockets');

// Connect as soon as the module is imported. Vercel imports this file without
// calling listen(), and Mongoose buffers queries until the connection is ready.
const dbReady = connectDB();
dbReady.catch((error) => console.error('[db] Connection failed:', error.message));

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

// Vercel uses this HTTP server export to handle both REST and WebSocket traffic.
module.exports = server;

async function start() {
  await dbReady;

  if (!config.isProd) {
    try {
      const { autoSeed } = require('./seed/seed');
      await autoSeed();
    } catch (error) {
      console.warn('[seed] Auto-seed skipped:', error.message);
    }
  }

  server.listen(config.port, () => {
    console.log(`\n  CoFoundr AI API`);
    console.log(`  Environment: ${config.env}`);
    console.log(`  API:         http://localhost:${config.port}/api`);
    console.log(`  Health:      http://localhost:${config.port}/api/health`);
    console.log(`  Client:      ${config.clientUrl}\n`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (require.main === module) {
  start().catch((error) => {
    console.error('[server] Failed to start:', error);
    process.exit(1);
  });
}
