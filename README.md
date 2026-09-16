# Fullstack Test App

A deliberately simple frontend + backend + database app, used to test the
`diagnose_deploy_failure` Kuberns MCP tool against realistic deploy bugs.

| Service  | Path       | Stack                       | Port (default) |
|----------|------------|------------------------------|-----------------|
| backend  | `backend`  | Node + Express + Postgres + Puppeteer | 3000 |
| frontend | `frontend` | React + Vite                 | 5173 (dev) / 4173 (preview) |

Deploy both as separate services in the same Kuberns project (same repo,
different `root_dir`), against one Postgres database resource.

## Backend env vars (runtime)
- `DATABASE_URL` — Postgres connection string. Kuberns does not auto-inject
  this for a normal repo-based deploy; copy it from the provisioned Postgres
  resource's credentials into the environment's env vars.
- `APP_API_KEY` — arbitrary secret; `/api/config-check` throws if it's unset.
- `PORT` — defaults to 3000.

## Frontend env vars (build-time)
- `VITE_API_BASE_URL` — the backend's public URL. Vite bakes this in at
  *build* time, not runtime — a different failure mode than the backend's vars.

## Endpoints
- `GET /health`
- `GET /api/items`, `POST /api/items` — Postgres-backed
- `GET /api/screenshot?url=...` — Puppeteer; needs Chromium's shared system
  libraries in the image or it builds fine but crashes at runtime
- `GET /api/config-check` — throws if `APP_API_KEY` is missing

## Run locally
    cd backend && npm install && DATABASE_URL=... APP_API_KEY=test npm start
    cd frontend && npm install && npm run dev
# fullstack-test-app
