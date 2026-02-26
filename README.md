# ai_news_next_node

Next.js + Node.js conversion of the live AI news stream, with Prisma (SQLite) and zod validation.

## Stack

- Frontend: Next.js 14 (`apps/web`)
- Backend: Node.js + Express + WebSocket (`apps/api`)
- Validation: zod (`packages/shared`)
- DB: Prisma + SQLite (`apps/api/prisma`)
- State management (web): Redux Toolkit + React Redux
- UI components (web): Material UI (MUI)

## Repo structure

- `apps/web`: Next.js app, reuses legacy UI (`public/legacy`) rendered directly in-page (no iframe).
  - Top menu is now a native React component: `apps/web/app/components/TopMenu.tsx`.
  - News runtime shell is now native React: `apps/web/app/components/NewsRuntimeShell.tsx`.
  - First React live card/column renderer added: `apps/web/app/components/ReactColumnsPreview.tsx` (reads `config/news` over WS and renders preview columns/cards).
  - React preview now supports a working Summary action (`run_summary_item`) with pending state.
  - React preview also supports Research action (`run_research_item`) with pending state and confidence subtitle extraction.
  - React preview now supports Ask Agent flow (`ask_agent_item` + `ask_agent_reply`) with draft, pending, message history, and remaining-question display.
  - React preview UI is now built with MUI components (`Card`, `Chip`, `Button`, `Typography`, etc.).
  - React preview now has stream-level controls: `Pin`, `Remove`, and per-stream `Show/Hide controls`.
  - React preview now reads `feedSettings` and supports per-stream `Summaries`, `Auto Research`, and `Budget` controls via WebSocket.
  - React preview now supports per-stream `Sort` and filter toggles (`Matches`, `Researched`, `Summaries`) via `set_feed_column_settings`.
  - React preview now supports per-stream polling interval updates via `set_feed_interval`.
  - React preview cards now support per-item `Show More / Show Less / Hide Summary / Hide Research` text controls.
  - React preview cards now include item-level `Share Link` and `Hide News` actions (`hide_item` wired to backend).
  - React preview labels now follow interface language (EN/BG) for migrated controls and item actions.
  - Top header surface now uses MUI primitives (`Chip`, `Button`, `Typography`) while preserving legacy DOM ids for compatibility.
  - Topbar actions are now React-driven via a custom-event bridge (`ai-news:*`) into legacy runtime handlers.
  - Search/Add Stream quick buttons now stay in quick-section mode and no longer reopen the full extended controls panel.
  - Search and Add Stream inputs are now rendered as React quick panels directly under the top menu and bridged to legacy handlers.
  - Global search query is now mirrored into RTK state and applied to React preview stream filtering.
  - RTK store and slices:
    - `apps/web/app/store/store.ts`
    - `apps/web/app/store/slices/connectionSlice.ts`
    - `apps/web/app/store/slices/feedsSlice.ts`
    - `apps/web/app/store/slices/newsSlice.ts`
    - `apps/web/app/store/slices/uiSlice.ts`
    - `apps/web/app/store/slices/aiUsageSlice.ts`
  - Centralized WS dispatcher: `apps/web/app/store/wsClient.ts`
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
- Top menu state (`menu/controls/search/add-stream/vibe`) is synchronized from legacy runtime into RTK `uiSlice` and used by React topbar labels.
- Global top actions now also affect the React preview (`Hide all column controls`, `Hide all research`).
- Keyboard shortcuts are now handled from React top-menu mode and dispatched through the same `ai-news:*` action bridge.
- Runtime DOM skeleton is now rendered by React components (topbar + grid/help/toast shell), while backend/websocket behavior and card/column rendering are still powered by `legacy/app.js`.
- Incremental migration path active: React preview columns render from live backend messages in parallel while legacy renderer remains the source of truth for full interaction controls.
- WebSocket event handling is now centralized via RTK dispatch flow for the React renderer; legacy script remains active in parallel until full migration.
- Web app fonts are now bundled locally via `@fontsource/*` packages (no Google Fonts build-time fetch requirement).
- WebSocket URL is configurable via `NEXT_PUBLIC_WS_URL` and query param fallback.
- Backend JSON state fallback remains for safety, while primary persistence is now Prisma/SQLite.
- `prisma:migrate` pre-creates `apps/api/prisma/dev.db` before applying migrations (required for SQLite startup in this setup).

## Host on your own computer

1. Keep machine awake and online.
2. Start both services with PM2:

```bash
pm2 start "npm run dev:api" --name ai-news-api
pm2 start "npm run dev:web" --name ai-news-web
pm2 save
```

3. For internet access, use Cloudflare Tunnel to expose only web (`3000`) and keep API internal.
