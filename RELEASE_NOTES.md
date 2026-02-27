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
- Improved column drag-and-drop UX in React grid:
  - dragged column now becomes semi-transparent during move
  - live hover target reorders columns visually before drop
  - stronger drop-target highlight and smoother movement transitions
- Improved column UI readability and density:
  - feed controls default to collapsed for newly seen streams
  - compact button/select/checkbox control styling to reduce clutter
  - enforced high-contrast text/icon colors inside column cards
  - stronger per-vibe visual differentiation across column and topbar surfaces
- Aligned Next.js appearance tokens with legacy `ai_news_node`:
  - reused legacy vibe base-color + scheme tuning logic for A/B/MATCH column accents
  - reused legacy vibe-specific action icon mapping (Font Awesome glyphs)
  - enabled Font Awesome stylesheet in Next layout for icon parity
  - updated item/column styling to mirror legacy accent contrast behavior
- Fixed feed rendering gate in React news slice:
  - regular columns now accept incoming `news` items regardless of `filteredOk`
  - resolves "Waiting for news..." across all columns when keyword matching is strict/empty
- Restored legacy-style Filtered stream in Next frontend:
  - `__filtered__` column is synthesized from server `feedSettings` and rendered in the grid
  - filtered column items are derived from matched news across all feeds (`isMatch` + `filteredOk`)
  - filtered stream hides remove/pin controls like the legacy UI
  - adjusted column header/title padding to prevent clipped leading text
- Fixed severe column-card UI regressions:
  - corrected MUI `sx` border-radius scaling that caused rounded/arched card tops and clipped content
  - replaced brittle icon-font rendering with guaranteed MUI icon rendering in icon mode
  - re-separated theme concerns: scheme now drives A/B/MATCH accent palettes; vibe drives icon/style flavor
- Restored always-visible item actions on news cards:
  - Summary / Research / Ask Agent buttons are no longer hidden behind column-control visibility
  - Ask Agent is available directly from every visible news item, matching expected UX
- Reduced column density on wide screens:
  - responsive grid now uses explicit `1/2/3/4` columns by breakpoint
  - prevents cluttered 5-column rows on large displays
- Filtered column behavior tightened:
  - Filtered stream is now always sorted to the first column position
  - Filtered column is not draggable (stays pinned at top/left)
  - empty Filtered state now shows “No matched news yet...” (instead of generic waiting)

### Existing migration milestones already in `main`
- Next.js web app and Node.js API monorepo with Prisma + SQLite + zod.
- MUI-based React preview cards and stream controls.
- Redux Toolkit store with centralized WebSocket dispatcher.
- React top menu bridge with quick Search/Add panels and keyboard shortcuts.
- Ask Agent flow, per-item summary/research actions, and per-stream settings controls.
