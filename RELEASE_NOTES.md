# Release Notes

## Unreleased

### Added
- Unit tests for Redux slices:
  - `uiSlice`, `feedsSlice`, `newsSlice`
  - `connectionSlice`, `aiUsageSlice`
- Unit tests for WebSocket event-to-Redux dispatch behavior:
  - `apps/web/app/store/wsClient.test.ts`
- GitHub Actions CI workflow:
  - install dependencies
  - Prisma client generation
  - unit tests
  - full monorepo build

### Existing migration milestones already in `main`
- Next.js web app and Node.js API monorepo with Prisma + SQLite + zod.
- MUI-based React preview cards and stream controls.
- Redux Toolkit store with centralized WebSocket dispatcher.
- React top menu bridge with quick Search/Add panels and keyboard shortcuts.
- Ask Agent flow, per-item summary/research actions, and per-stream settings controls.
