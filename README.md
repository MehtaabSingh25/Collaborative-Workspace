# Collaborative Workspace

A full-stack collaborative workspace built with Next.js, React, TypeScript, Express, MongoDB/Mongoose and Socket.IO. The application combines workspace membership and invitations, role-based access control, collaborative documents with revision history, task management, and workspace chat.

## Features

- **Authentication:** registration and login with hashed passwords, JWT access/refresh token handling, and protected API routes.
- **Workspaces:** create workspaces, invite members, accept invitations, and enforce active membership.
- **Role-based access:** workspace roles include `OWNER`, `EDITOR`, and `VIEWER`; permissions are enforced on the server.
- **Collaborative documents:** create and update documents, maintain revision history, and restore prior versions with version checks.
- **Tasks:** create, assign, prioritize, update status, set due dates, and delete workspace tasks.
- **Real-time collaboration:** authenticated Socket.IO connections, workspace/document rooms, collaborator presence, live document updates, and workspace chat events.
- **Security foundations:** request validation, security headers, CORS configuration, rate limiting, and server-side authorization.
- **Automated checks:** backend TypeScript build and Vitest tests, plus frontend ESLint and Next.js production build through GitHub Actions.

## Architecture

```text
frontend/  Next.js App Router + React + TypeScript + Socket.IO client
    |
    | HTTP / JSON and authenticated Socket.IO connection
    v
backend/   Express 5 + TypeScript + Mongoose + Socket.IO server
    |
    v
MongoDB    Users, workspaces, memberships, documents, revisions, tasks, chat messages
```

## Prerequisites

- Node.js 22 (Node.js 20.9+ is the minimum for the current Next.js version; Node 22 is used in CI)
- npm
- A MongoDB instance, local or hosted

## Local setup

### 1. Configure the backend

```bash
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env` and replace the placeholder secrets. Ensure `MONGODB_URI` points to a running MongoDB instance and `CLIENT_URL` matches the frontend origin.

Start the API and Socket.IO server:

```bash
npm run dev
```

The backend defaults to port `5000`. Check `http://localhost:5000/api/health` for the health response.

### 2. Configure the frontend

In another terminal:

```bash
cd frontend
npm ci
```

Copy `frontend/.env.local.example` to `frontend/.env.local`. Set `NEXT_PUBLIC_API_URL` to the backend base URL (default `http://localhost:5000`). Start Next.js:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Express/Socket.IO port | `5000` |
| `CLIENT_URL` | Allowed frontend origin for CORS and Socket.IO | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/collaborative_workspace` |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens | Use a long random secret |
| `JWT_REFRESH_SECRET` | Separate secret used to sign refresh tokens | Use a different long random secret |
| `ACCESS_TOKEN_EXPIRES_IN` | Access-token lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh-token lifetime | `7d` |

### Frontend (`frontend/.env.local`)

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL used by browser HTTP and Socket.IO clients | `http://localhost:5000` |

Never commit real `.env` or `.env.local` files or production secrets. The example files contain placeholders only.

## API overview

All API routes use the `/api` prefix. Protected endpoints require the authentication mechanism implemented by the application.

| Area | Routes |
|---|---|
| Health | `GET /api/health` |
| Authentication | `/api/auth` — see `backend/src/modules/auth/auth.routes.ts` for the current route list |
| Workspaces | `GET/POST /api/workspaces`, `GET /api/workspaces/:workspaceId` |
| Invitations | `GET /api/workspaces/invitations`, `POST /api/workspaces/:workspaceId/invite`, `POST /api/workspaces/:workspaceId/accept` |
| Documents | `/api/workspaces/:workspaceId/documents` — CRUD, history, and restore routes |
| Tasks | `GET/POST /api/workspaces/:workspaceId/tasks`, `PATCH/DELETE /api/workspaces/:workspaceId/tasks/:taskId` |
| Chat history | `GET /api/workspaces/:workspaceId/chat/messages` |

Real-time events and payload types are defined in `backend/src/socket/socket.types.ts`; handlers are in `backend/src/socket/`.

## Quality checks

Run the same checks locally that CI runs:

```bash
cd backend
npm ci
npm run build
npm test

cd ../frontend
npm ci
npm run lint
npm run build
```

Backend tests use Vitest and the project's test setup. Some integration tests start an in-memory MongoDB instance, which may need to download its MongoDB binary the first time they run.

GitHub Actions runs backend build/tests and frontend lint/build on pushes and pull requests targeting `main`.

## Security and deployment notes

- Keep JWT secrets unique, random, and private; never use the example values in production.
- Configure `CLIENT_URL` and `NEXT_PUBLIC_API_URL` to the exact deployed frontend and backend origins.
- Use HTTPS in production and configure MongoDB network access and credentials appropriately.
- Review `npm audit` output and upgrade dependencies deliberately; avoid applying breaking upgrades blindly with `npm audit fix --force`.
- Before production deployment, verify cookie settings, token lifecycle behavior, rate limits, logging, backups, and CORS against the target hosting environment.

## Repository layout

```text
backend/
  src/modules/       auth, workspace, document, task, chat
  src/socket/        authenticated Socket.IO handlers and event types
  tests/             API, RBAC, rate-limit, and socket tests
frontend/
  app/               Next.js pages and workspace UI
  src/lib/           Socket.IO client setup
.github/workflows/   continuous integration
```

## License

No license is currently declared. Add a `LICENSE` file if you intend to permit reuse or redistribution.
