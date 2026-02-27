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

- `apps/web`: Next.js app with native React/MUI UI.
  - Top menu is now a native React component: `apps/web/app/components/TopMenu.tsx`.
  - Live card/column renderer: `apps/web/app/components/ReactColumnsPreview.tsx` (reads `config/news` over WS and renders stream columns/cards).
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
  - React preview now supports per-stream delete-age cleanup (`Yesterday`, `Past week`, `Past month`, `Past year`) with `Delete old`.
  - Unit tests cover Redux slices and WebSocket dispatch mapping (`apps/web/app/store/**/*.test.ts`).
  - Top header surface uses MUI primitives (`Chip`, `Button`, `Typography`) and Redux-owned state/actions.
  - Search/Add Stream quick buttons control React-owned quick panels directly under the top menu.
  - Global search query is now mirrored into RTK state and applied to React preview stream filtering.
  - Extended top controls are React-owned (`Notifications`, `AI Settings`, `Appearance`) and send WebSocket messages directly.
  - Column order supports drag-and-drop in React with local persistence.
  - UI preferences (menu/control visibility, theme, vibe, font, notifications) are persisted from Redux state to local storage.
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

## Tests

```bash
npm run test
```

Current unit coverage includes:

- Redux slices: `ui`, `feeds`, `news`, `connection`, `aiUsage`
- WebSocket client dispatch flow: `apps/web/app/store/wsClient.ts`

## CI

GitHub Actions workflow:

- `.github/workflows/ci.yml`
- Runs on push/PR: install, Prisma client generation, unit tests, and full build

## Notes on this conversion

- Top menu, help modal, search/add-stream panels, and stream columns are now React-owned.
- Global top actions affect React preview directly (`Hide all column controls`, `Hide all research`, menu/control toggles).
- Keyboard shortcuts are handled directly in React.
- WebSocket event handling is centralized via RTK dispatch flow for the React renderer.
- Legacy runtime/script/style are no longer loaded by the Next.js page/layout.
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
