# ai_news_next_node

Next.js + Node.js conversion of the live AI news stream, with Prisma (SQLite) and zod validation.

## Stack

- Frontend: Next.js 14 (`apps/web`)
- Backend: Node.js + Express + WebSocket (`apps/api`)
- Validation: zod (`packages/shared`)
- DB: Prisma + SQLite (`apps/api/prisma`)

## Repo structure

- `apps/web`: Next.js app, currently reuses the proven legacy UI (`public/legacy`) inside the Next shell.
- `apps/api`: Polling/AI/WebSocket server (migrated from the original project), now with:
  - zod WebSocket message validation
  - Prisma SQLite app-state persistence + AI usage snapshots
- `packages/shared`: shared zod schemas/types used by backend

## Environment

Copy `.env.example` to `.env` in repo root and set:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_WS_URL` (default local backend: `ws://localhost:4000`)
- `DATABASE_URL` (SQLite path, default: `file:./dev.db`)

## Run locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Services:

- Web: `http://localhost:3000`
- API WS/health: `ws://localhost:4000`, `http://localhost:4000/health`

## Build

```bash
npm run build
```

## Notes on this conversion

- Existing UX logic and behavior are preserved by reusing the mature UI code in `apps/web/public/legacy/app.js`.
- WebSocket URL is configurable via `NEXT_PUBLIC_WS_URL` and query param fallback.
- Backend JSON state fallback remains for safety, while primary persistence is now Prisma/SQLite.

## Host on your own computer

1. Keep machine awake and online.
2. Start both services with PM2:

```bash
pm2 start "npm run dev:api" --name ai-news-api
pm2 start "npm run dev:web" --name ai-news-web
pm2 save
```

3. For internet access, use Cloudflare Tunnel to expose only web (`3000`) and keep API internal.
