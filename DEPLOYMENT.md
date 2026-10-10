# Deployment guide

This project has a Next.js frontend and an Express/Socket.IO backend. Deploy them as separate services and use a hosted MongoDB deployment such as MongoDB Atlas.

## 1. Prepare MongoDB

1. Create a production database and a dedicated database user.
2. Allow network access only from the backend host where possible. Avoid `0.0.0.0/0` unless your provider requires it and you understand the trade-off.
3. Copy the connection string into the backend service as `MONGODB_URI`. Do not commit credentials.

## 2. Deploy the backend (Docker-capable host)

Use the repository root as the source and `backend/Dockerfile` as the Dockerfile path (for example, on Render or another Docker host). Configure these environment variables in the hosting dashboard:

- `NODE_ENV=production`
- `PORT` — use the port supplied by the host if it provides one; otherwise `5000`
- `MONGODB_URI` — production MongoDB connection string
- `JWT_ACCESS_SECRET` — long, random secret
- `JWT_REFRESH_SECRET` — a different long, random secret
- `ACCESS_TOKEN_EXPIRES_IN=15m`
- `REFRESH_TOKEN_EXPIRES_IN=7d`
- `CLIENT_URL` — exact deployed frontend origin, including `https://` and no trailing path

Use distinct random secrets for access and refresh tokens. Never put secrets in source control, frontend environment variables, build logs, or public CI variables.

After deployment, verify `https://YOUR_BACKEND_HOST/api/health` returns HTTP 200. This health route confirms the HTTP server is responding; it does not independently verify database health.

## 3. Deploy the frontend

For Vercel, import the repository and set the project Root Directory to `frontend`. Set this environment variable in the Vercel project settings:

- `NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_HOST` — backend origin, with no trailing slash and no `/api` suffix

Redeploy after changing this value because `NEXT_PUBLIC_*` values are embedded into the browser bundle at build time. The value is public; never place secrets in it.

Alternatively, use `frontend/Dockerfile` on a Docker-capable host and provide `NEXT_PUBLIC_API_URL` as a Docker build argument, e.g. `docker build --build-arg NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_HOST -t collaborative-workspace-frontend ./frontend`.

## 4. CORS, cookies and Socket.IO

- Set backend `CLIENT_URL` to the exact frontend origin. Do not use `*` when credentials/cookies are involved.
- Ensure the frontend uses HTTPS and the backend URL uses HTTPS in production.
- Test login, refresh-token behavior, document collaboration, and Socket.IO connection from the deployed origin. If authentication cookies are used across different sites, verify cookie `SameSite` and `Secure` settings in the auth implementation; hosting configuration alone cannot fix incompatible cookie attributes.
- Confirm the hosting plan supports long-lived WebSocket connections and does not aggressively sleep the backend during active collaboration.

## 5. Production verification checklist

- [ ] `GET /api/health` returns 200.
- [ ] Frontend can register and log in.
- [ ] Refresh/reload preserves the expected authenticated state.
- [ ] A workspace member can load documents and tasks.
- [ ] Two active members can exchange chat messages in real time.
- [ ] A non-member cannot access workspace data.
- [ ] Browser console and backend logs contain no secrets or repeated connection errors.
- [ ] Production database user and network access are restricted.

## 6. Local Docker smoke test

Build and run the backend with the required environment variables provided securely by your shell or a local, untracked env file. Build the frontend with the backend URL as a build argument. Do not publish production secrets in command history or commit local env files.

```bash
docker build -t collaborative-workspace-backend ./backend
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 -t collaborative-workspace-frontend ./frontend
```

The backend container requires `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, and optionally `PORT` and `CLIENT_URL` at runtime.
