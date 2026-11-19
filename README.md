# CoFoundr AI

> An AI-assisted co-founder and teammate matching platform. Founders build a rich profile, the matching engine scores compatibility across seven weighted dimensions, and accepted connections unlock realtime chat, startup posts, and collaboration applications.

![stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Express%205%20%2B%20MongoDB-7657FF)
![tests](https://img.shields.io/badge/tests-23%20passing-2EA043)

---

## Table of contents

- [Status & roadmap](#status--roadmap)
- [Feature highlights](#feature-highlights)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How matching works](#how-matching-works)
- [API reference](#api-reference)
- [Realtime events](#realtime-events)
- [Testing](#testing)
- [Production build & Docker](#production-build--docker)
- [Troubleshooting](#troubleshooting)

---

## Status & roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| **Phase 1** | Backend foundation: auth, users, matching engine, connections, messaging, startups, notifications, admin, reports, sockets, seed data, API tests | ✅ Complete |
| **Phase 2** | React client: landing page, auth flows, onboarding wizard, dashboard, discover, matches, profiles, startups, connections, chat, notifications, settings, admin console, responsive styling | ✅ Complete |
| **Phase 3** | Production hardening: route-level code splitting, flow tests (connections/messaging/startups), deprecation cleanup, Docker + CI, documentation | ✅ Complete |

The project is feature-complete for a demo/MVP release. Natural next steps are email notifications, saved searches, richer analytics, and an LLM re-ranker in production.

---

## Feature highlights

**Founder experience**
- Email/password auth with httpOnly cookie sessions, rate limiting, and password reset
- Guided onboarding with profile completion scoring
- Weighted compatibility matching with a transparent score breakdown and human-readable reasons
- Discover with search, filters (industry, skill, category, availability, experience, location), sorting, pagination, and saved profiles
- Connection requests with accept/reject/cancel and mutual-request auto-accept
- Realtime chat (Socket.IO) with typing indicators, unread counts, read receipts, and presence
- Startup board: publish ideas, browse/filter, apply to join, review applications, and founder recommendations
- Notifications, reporting/moderation, account settings, password change, and account deactivation

**Admin console**
- Platform stats and growth charts
- User search, role/status management, and account deletion
- Report queue with status workflow

**Engineering**
- REST API with a consistent `{ success, message, data }` envelope and structured `422` validation errors
- 7-factor deterministic matching engine, optionally enhanced by an OpenAI-compatible LLM
- Helmet, CORS allow-list, NoSQL-injection guard, rate limits, input validation, and sanitized public profiles
- Route-level code splitting (main bundle ~239 kB, down from ~710 kB)
- 23 automated tests covering auth, matching, connections, messaging, saved profiles, startup applications, and admin access

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Client | React 19, React Router 7, Vite 8, Axios, Socket.IO client, Framer Motion, Lucide, react-hot-toast |
| Server | Node.js, Express 5, Mongoose 9, Socket.IO 4, JWT, bcryptjs, Helmet, express-validator, express-rate-limit |
| Database | MongoDB 7 (Atlas, Docker, or the bundled `mongodb-memory-server` for local dev) |
| Email | Nodemailer (optional; reset links print to the console when SMTP is unset) |
| AI | Optional OpenAI-compatible chat completions API (`LLM_ENABLED=false` by default) |

---

## Quick start

**Requirements:** Node.js 20+ (22 recommended) and npm.

```bash
cd cofoundr-ai
npm run install:all
npm run seed      # optional on first run — the dev server auto-seeds an empty DB
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:5000/api
- Health: http://localhost:5000/api/health

No MongoDB installation is required. When `MONGODB_URI` is empty the server starts a local `mongodb-memory-server` instance and persists data in `server/.mongo-data`. To use Atlas or a local MongoDB instead, set `MONGODB_URI` in `server/.env`.

> **Windows PowerShell note:** if `npm` fails with `npm.ps1 cannot be loaded because running scripts is disabled`, run commands through `cmd /c "npm run dev"` or set `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

---

## Demo accounts

Seeded automatically in development (`npm run seed -- --force` resets demo data).

| Role | Email | Password |
| --- | --- | --- |
| Founder (main demo) | `demo@cofoundr.ai` | `Password123!` |
| Admin | `admin@cofoundr.ai` | `Admin@12345` |
| 10 additional founders | `sofia@`, `daniel@`, `priya@`, `lucas@`, `amara@`, `noah@`, `emma@`, `rohan@`, `mei@`, `diego@`, `zara@` `cofoundr.ai` | `Password123!` |

The seed includes accepted/pending connections, two conversations, a pending startup application, notifications, and precomputed matches for the demo founder.

---

## Environment variables

Copy `.env.example` to `server/.env` (the repo already ships a development `server/.env`). All variables are optional in development.

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` enables static client serving and strict config checks |
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin and password-reset link base |
| `MONGODB_URI` | _(empty)_ | Empty → bundled local MongoDB. Use an Atlas URI in production |
| `USE_MEMORY_MONGO` | `true` | Set `false` to forbid the bundled database |
| `MONGOMS_VERSION` | `7.0.14` | Memory-server binary version |
| `JWT_SECRET` | dev fallback | **Required in production** (32+ random characters) |
| `JWT_EXPIRES_IN` | `7d` | Session lifetime |
| `COOKIE_SECURE` | `true` in prod | Set `false` to run production over plain HTTP (e.g. local Docker) |
| `LLM_ENABLED` | `false` | Requires `LLM_API_KEY`; enhances top matches |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible endpoint |
| `LLM_API_KEY` / `LLM_MODEL` | — / `gpt-4o-mini` | LLM credentials and model |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | — / `587` | Password-reset email; console fallback when empty |
| `EMAIL_FROM` | `CoFoundr AI <no-reply@cofoundr.ai>` | Sender address |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@cofoundr.ai` / `Admin@12345` | Seeded admin account |
| `MAX_UPLOAD_MB` | `2` | Avatar upload limit |

Production refuses to boot without `JWT_SECRET` and `MONGODB_URI`.

---

## Scripts

Run from the `cofoundr-ai` root:

| Command | Description |
| --- | --- |
| `npm run dev` | API + Vite dev server together |
| `npm run dev:server` | API only (nodemon) |
| `npm run dev:client` | Vite only |
| `npm run seed` | Seed demo data if the database is empty |
| `npm run seed -- --force` | Wipe and reseed demo data |
| `npm run build` | Build the client into `client/dist` |
| `npm start` | Start the API in production mode (serves `client/dist`) |
| `npm test` | Run the server test suite |
| `npm run install:all` | Install root, server, and client dependencies |

---

## Project structure

```
cofoundr-ai/
├─ client/
│  ├─ src/
│  │  ├─ components/     # UI primitives, landing sections, protected routes
│  │  ├─ context/        # Auth, Socket, Notification providers
│  │  ├─ hooks/          # useFetch, useDebounce, useInterval, …
│  │  ├─ layouts/        # App, Auth, Admin shells
│  │  ├─ pages/          # public, auth, onboarding, app, admin
│  │  ├─ services/       # Axios API modules + socket client
│  │  ├─ styles/         # tokens, base, app, chat, admin, responsive
│  │  └─ utils/          # constants, formatters, validators
│  └─ vite.config.js     # dev proxy for /api, /uploads, /socket.io
├─ server/
│  ├─ config/            # env + database connection
│  ├─ controllers/       # route handlers
│  ├─ middleware/        # auth, roles, validation, rate limits, upload, errors
│  ├─ models/            # User, Match, Connection, Conversation, Message, Startup, …
│  ├─ routes/            # REST route definitions
│  ├─ seed/              # demo data + seeder
│  ├─ services/          # matching engine, messaging, notifications, email, LLM
│  ├─ sockets/           # Socket.IO auth, presence, typing, chat
│  ├─ tests/             # node:test + supertest suites
│  └─ utils/             # tokens, pagination, constants, realtime helpers
├─ Dockerfile
├─ docker-compose.yml
└─ .github/workflows/ci.yml
```

---

## How matching works

Every founder pair is scored deterministically on a 0–100 scale:

| Factor | Weight | Signal |
| --- | --- | --- |
| Complementary skills | 25% | Technical vs. business/hybrid divergence; penalizes near-identical stacks |
| Shared interests | 15% | Jaccard overlap of industry interests |
| Startup goals | 15% | Text similarity of startup type, problems, vision, and desired co-founder qualities, plus preference fit |
| Industry alignment | 15% | Interests vs. the other founder's stated startup domain |
| Availability | 10% | Full-time/part-time/weekend/flexible compatibility matrix |
| Working style | 10% | Work style + risk tolerance alignment |
| Experience | 10% | Pairs adjacent levels highest; extreme gaps score lower |

The engine stores results in the `Match` collection with a factor breakdown (`0–100` per factor), reasons, source (`rules` or `llm`), and a 7-day expiry. Profiles are rescored on save and on demand via `POST /api/matches/recalculate`.

When `LLM_ENABLED=true`, the top five matches get a bounded score adjustment and rewritten reasons from an OpenAI-compatible endpoint; failures fall back silently to the rule-based result.

Startup fit (`GET /api/startups/:id/recommended`) uses a separate score: 55% required-skill match, 25% industry alignment, 10% required-role coverage, 10% availability.

---

## API reference

All routes are prefixed with `/api`. Authentication uses an httpOnly cookie (`cofoundr_token`); protected routes return `401` without it.

Responses follow:

```json
{ "success": true, "message": "…", "data": { } }
```

Validation failures return `422` with `{ success: false, message, errors: { field: "message" } }`.

| Area | Method & path | Description |
| --- | --- | --- |
| Health | `GET /health` | Status + database connectivity |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | Session lifecycle |
| Auth | `POST /auth/forgot-password` · `POST /auth/reset-password/:token` · `PUT /auth/change-password` | Password management |
| Users | `GET /users` | Discover: `search, skill, location, industry, availability, category, experience, sort, saved, page, limit` |
| Users | `GET /users/featured` · `GET /users/:id` | Featured founders + profile detail (records profile views) |
| Users | `PUT /users/profile` · `POST /users/avatar` · `PUT /users/settings` · `POST /users/deactivate` | Profile and account management |
| Users | `PUT /users/:id/save` | Toggle saved profile |
| Matches | `GET /matches` · `POST /matches/recalculate` · `GET /matches/:userId/explain` | Ranked matches, rescore, pair explanation |
| Connections | `POST /connections/request` · `GET /connections` · `PUT /connections/:id/accept` · `PUT /connections/:id/reject` · `DELETE /connections/:id` | Connection lifecycle |
| Chat | `GET /conversations` · `POST /conversations` · `GET /messages/:conversationId` · `POST /messages` · `PUT /messages/:conversationId/read` | Conversations and messages (accepted connections only) |
| Startups | `POST /startups` · `GET /startups` · `GET /startups/:id` · `PUT /startups/:id` · `DELETE /startups/:id` | Startup board |
| Startups | `GET /startups/:id/recommended` · `POST /startups/:id/apply` · `GET /startups/:id/applications` · `PUT /startups/applications/:applicationId` | Founder recommendations and applications |
| Notifications | `GET /notifications` · `PUT /notifications/read-all` · `PUT /notifications/:id/read` · `DELETE /notifications/:id` | In-app notifications |
| Reports | `POST /reports` | Report a profile or startup |
| Dashboard | `GET /dashboard` | Stats, top matches, conversations, connections, startups |
| Admin | `GET /admin/stats` · `GET /admin/users` · `PUT /admin/users/:id` · `DELETE /admin/users/:id` · `GET /admin/reports` · `PUT /admin/reports/:id` | Admin-only |

---

## Realtime events

Socket.IO authenticates with the same httpOnly cookie (or `auth.token`) during the handshake.

| Direction | Event | Purpose |
| --- | --- | --- |
| Server → client | `presence:list` / `presence:update` | Initial online IDs and online/offline transitions |
| Client → server | `chat:typing` | `{ receiverId, isTyping }` |
| Server → client | `chat:typing` | Typing indicator forwarded to the receiver |
| Client → server | `chat:send` | `{ receiverId, content }` with an ack callback |
| Server → client | `chat:new` | New message payload to both participants |
| Client → server | `chat:read` | `{ conversationId }` |
| Server → client | `chat:read` | Read receipt to the other participant |
| Server → client | `connection:update` | Connection accepted/rejected/removed |
| Server → client | `notification:new` | New in-app notification |

---

## Testing

```bash
npm test
```

The suite uses Node's built-in test runner, Supertest, and an isolated in-memory MongoDB per test file (no external services required):

- `tests/api.test.js` — health, registration/validation, login, protected routes, profile privacy, admin authorization, 404 contract
- `tests/matchingEngine.test.js` — weights, score bounds, symmetry, complementary-skill behavior, text similarity, startup fit
- `tests/flows.test.js` — connection lifecycle, messaging permissions and unread state, saved profiles, startup applications and review, connection cleanup

---

## Production build & Docker

**Manual**

```bash
npm run build                 # client → client/dist
NODE_ENV=production \
MONGODB_URI="mongodb+srv://…" \
JWT_SECRET="a-long-random-secret" \
npm start                     # Express serves the API + built client on PORT
```

**Docker Compose**

```bash
JWT_SECRET="a-long-random-secret" docker compose up --build
```

Open http://localhost:5000. The compose stack runs MongoDB 7 with a persistent volume, builds the client, and serves everything from the Node container. Override `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `COOKIE_SECURE=false` for plain-HTTP local deployments.

CI (`.github/workflows/ci.yml`) runs the server tests and a production client build on every push and pull request.

---

## Vercel deployment

Deploy the repo as **two Vercel projects**:

| Project | Root Directory | Build | Notes |
| --- | --- | --- | --- |
| Backend (`cofoundr-api`) | `server` | Zero-config Node/Express | `server.js` exports the HTTP server with Socket.IO attached |
| Frontend (`cofoundr-ai`) | `client` | Vite (`npm run build` → `dist`) | Uses `VITE_*` env vars to reach the backend |

Backend environment variables:

```text
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32+ random characters>
CLIENT_URL=https://<your-frontend>.vercel.app
USE_MEMORY_MONGO=false
```

Frontend environment variables (see `client/.env.example`):

```text
VITE_API_URL=https://<your-backend>.vercel.app/api
VITE_SOCKET_URL=https://<your-backend>.vercel.app
VITE_SOCKET_PATH=/socket.io
VITE_UPLOADS_URL=https://<your-backend>.vercel.app
```

Deploy with `npx vercel --prod` from each directory. Socket.IO on Vercel requires Fluid compute (default for new projects), websocket-only transport (handled automatically when `VITE_SOCKET_URL` is set), and Redis pub/sub for presence/messages across multiple function instances. Connections close at the function max duration; the client reconnects automatically.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm.ps1 cannot be loaded` on Windows | Use `cmd /c "npm …"` or relax the PowerShell execution policy |
| Port 5000 already in use | Change `PORT` in `server/.env` and the Vite proxy target in `client/vite.config.js` |
| Login appears to succeed but no session persists in production | Set `COOKIE_SECURE=false` when serving over plain HTTP, or terminate TLS in front of the app |
| Local Mongo fails to start | Set `MONGOMS_VERSION=7.0.14` (already default) or point `MONGODB_URI` at a real MongoDB |
| Reset email not received | SMTP is unset by default — the reset link is printed in the server console in development |
| Matches are empty | Complete onboarding, then call `POST /api/matches/recalculate` or open the Matches page |

---

Built with care. PRs, issues, and wild startup ideas welcome.
