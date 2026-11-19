const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const isProd = process.env.NODE_ENV === 'production';

const config = {
  env: process.env.NODE_ENV || 'development',
  isProd,
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  useMemoryMongo: process.env.USE_MEMORY_MONGO !== 'false',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'cofoundr_token',
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : isProd,
  llm: {
    enabled: process.env.LLM_ENABLED === 'true' && Boolean(process.env.LLM_API_KEY),
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 10000,
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'CoFoundr AI <no-reply@cofoundr.ai>',
  },
  admin: {
    email: (process.env.ADMIN_EMAIL || 'admin@cofoundr.ai').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
  uploads: {
    dir: path.join(__dirname, '..', 'uploads'),
    maxMb: Number(process.env.MAX_UPLOAD_MB) || 2,
  },
};

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

if (isProd && !config.mongoUri) {
  throw new Error('MONGODB_URI must be set in production');
}

module.exports = config;
