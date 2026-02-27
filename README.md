# AI News Next + Node

[![CI](https://github.com/donetian-petkov/ai_news_next_node/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/donetian-petkov/ai_news_next_node/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-Enabled-764ABC?logo=redux&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white)

Next.js + Node.js implementation of the live AI news stream app, with WebSocket updates, per-column controls, Ask Agent, and persisted state via Prisma + SQLite.

## Highlights

- Real-time news cards over WebSocket with feed-level controls.
- AI summary + research actions (manual and auto modes).
- Ask Agent per news item with usage guardrails and question limits.
- Filtered stream for matched items.
- Theme/vibe, fonts, color scheme, notifications, and mobile-aware UI behavior.
- Redux Toolkit state with typed slices and WebSocket dispatch flow.
- Performance improvements:
  - WebSocket news batching to reduce render thrash.
  - Lazy hydration for below-fold columns.

## Architecture

| Layer | Tech | Location |
|---|---|---|
| Frontend | Next.js 14 + React 18 + MUI + RTK | `apps/web` |
| Backend | Node.js + Express + ws | `apps/api` |
| Validation | zod schemas/types | `packages/shared` |
| Persistence | Prisma + SQLite | `apps/api/prisma` |

## Monorepo Structure

```text
ai_news_next_node/
  apps/
    api/        # polling, matching, AI jobs, websocket server
    web/        # next.js ui
  packages/
    shared/     # zod contracts + shared types
```

## Quick Start

### 1) Prerequisites

- Node.js 20+
- npm 10+

### 2) Configure environment

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

Required variables:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_WS_URL` (default: `ws://localhost:4000`)
- `DATABASE_URL` (default: `file:./dev.db`)

### 3) Install + initialize

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 4) Run in development

```bash
npm run dev
```

Services:

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/health`
- WebSocket: `ws://localhost:4000`

## Scripts

```bash
# Run web + api together
npm run dev

# Run individually
npm run dev:web
npm run dev:api

# Build all workspaces
npm run build

# Web tests (vitest)
npm run test
```

## Current Functional Scope

- Top menu + expanded controls are React-owned.
- Search/Add Stream quick panels are controlled from top menu buttons.
- Stream order drag-and-drop with local persistence.
- Per-stream settings:
  - Summaries
  - Auto Research
  - Budget
  - Poll interval
  - Sort + filter toggles
  - Delete old by age window
- Per-item actions:
  - Summary
  - Research
  - Ask Agent
  - Share Link
  - Hide News
  - Show More / Show Less / Hide summary/research content
- Notifications:
  - only matched
  - only pinned columns
  - matched + pinned columns
  - all columns
- BG/EN interface support.

## Testing

Current automated coverage includes:

- Redux slices (`ui`, `feeds`, `news`, `connection`, `aiUsage`)
- WebSocket client message mapping and connection lifecycle

Run:

```bash
npm run test
```

## Build for Production

```bash
npm run build
npm run start
```

## Self-Hosting on Your Own Computer

For always-on local hosting:

1. Keep machine awake and connected.
2. Run with PM2:

```bash
pm2 start "npm run dev:api" --name ai-news-api
pm2 start "npm run dev:web" --name ai-news-web
pm2 save
```

3. (Optional) expose web safely with Cloudflare Tunnel and keep API internal.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline runs:

- dependency install
- Prisma generate/migrate
- unit tests
- full monorepo build

## Release Notes

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for chronological change history.
