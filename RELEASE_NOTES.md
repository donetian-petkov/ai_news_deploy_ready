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
- React-owned UI settings in Redux (`uiSlice`) for:
  - notifications
  - AI settings (availability/enabled/languages/budget)
  - appearance (font/font-size/scheme/button mode/vibe/color mode)
  - help dialog visibility
- React drag-and-drop stream ordering with local persistence.
- React browser-notification dispatch for new items (based on notify mode + pinned/match rules).
- Redux-driven MUI theme bridge (`apps/web/app/providers.tsx`) for:
  - system/dark/light color mode
  - font family presets
  - font size presets

### Changed
- Removed runtime dependency on legacy UI from Next.js entrypoints:
  - removed legacy script load from `apps/web/app/page.tsx`
  - removed legacy stylesheet load from `apps/web/app/layout.tsx`
- Removed `NewsRuntimeShell` compatibility component.
- Migrated top-controls behavior to direct Redux/WebSocket flow (no `ai-news:*` bridge in React components).
- Migrated global preference persistence from legacy runtime to Redux-backed local storage.
- Fixed top-menu/theme CSS regression:
  - synchronized resolved color mode (`system` -> `dark`/`light`) between MUI and CSS data attributes
  - improved contrast variables for top menu, control panels, and fields
  - normalized MUI button typography (no forced uppercase) and improved small-button readability
  - improved column/news card readability under vibe + scheme combinations
- Fixed WebSocket item handling in Next frontend:
  - regular feed columns no longer discard items with `filteredOk=false`
  - resolves empty “Waiting for news...” columns when keywords are empty or strict matching is enabled

### Existing migration milestones already in `main`
- Next.js web app and Node.js API monorepo with Prisma + SQLite + zod.
- MUI-based React preview cards and stream controls.
- Redux Toolkit store with centralized WebSocket dispatcher.
- React top menu bridge with quick Search/Add panels and keyboard shortcuts.
- Ask Agent flow, per-item summary/research actions, and per-stream settings controls.
