# Development Retrospective And Playbook

This document analyzes the recent development cycle and defines a concrete execution model to reduce rework, delays, and token/time burn in future iterations.

## Scope Of Analysis

- Repository: `ai_news_next_node`
- Period reviewed: commits from initial React/Next migration to `v1` release (`1415595` -> `7f2fd2d`)
- Primary themes in commits:
  - Architecture migration (`legacy -> Redux/React ownership`)
  - UI/UX refinements (vibes, ornaments, top menu, mobile)
  - Reliability fixes (drag reorder, visibility state, websocket UI sync)
  - Performance and readability adjustments
  - Localization and user controls

## What Slowed Development

1. Design target changed often without a locked acceptance contract.
- Result: repeated style passes, overlap regressions, and multiple ornament revisions.

2. Large components accumulated too much mixed responsibility before decomposition.
- Result: frequent high-risk edits and prop-drilling churn.

3. State ownership migration happened while feature work continued.
- Result: "bridge" code persisted longer, causing duplicate logic paths.

4. DnD and UI behavior lacked scenario-level test coverage.
- Result: repeated fixes for "drop looks correct but order resets."

5. Mobile UX was corrected late and iteratively.
- Result: multiple cycles for sidebar/menu behavior and spacing.

6. Localization/i18n and language-specific typography were integrated late.
- Result: duplicated label maps and avoidable cleanup passes.

7. Too many magic numbers and inline style decisions in active feature flow.
- Result: slower consistency updates and visual drift.

## High-Value Changes That Worked

1. Progressive split of top menu/columns into focused hooks and sections.
2. Introduction of design tokens/enums and context to reduce brittle string comparisons.
3. Performance-mode feature gating and render optimizations.
4. Docs and release-note discipline improvements.
5. Clearer "single feature per commit" trend in later commits.

## Next-Cycle Execution Model (Recommended)

## Phase 0: Freeze Contracts (Before Coding)

Create and approve these artifacts first:

1. **UX Contract (`docs/contracts/ui-contract.md`)**
- Desktop/mobile layout rules
- Exact behavior for key interactions (drag, show +5, reset to 10, menu collapse, share)
- "No-overlap" and readability rules

2. **Vibe Design Contract (`docs/contracts/vibe-contract.md`)**
- Per-vibe shape language (not colors only)
- Ornament safe-zones and maximum extents
- Approved icon sets and corner glyphs per vibe
- Explicit "forbidden" patterns (e.g., overlays across text)

3. **State Ownership Map (`docs/contracts/state-ownership.md`)**
- Which slice/context owns each concern
- No dual ownership between bridge and React

4. **Definition Of Done (`docs/contracts/dod.md`)**
- Functional acceptance checklist
- Visual acceptance checklist
- Test checklist
- Performance checklist

## Phase 1: Architecture First

1. Finish ownership migration before new feature surface growth.
2. Enforce component limits:
- Max ~250 lines for page-level components
- Max ~150 lines for leaf visual components
3. Move cross-cutting concerns to hooks/services/context:
- Keyboard shortcuts
- Menu/open-close orchestration
- Feed action orchestration
- Persistence/hydration

## Phase 2: Design System First, Feature Second

1. Build/extend primitives in `design_system/` first:
- `Button`, `IconButton`, `Select`, `Input`, `Chip`, `Panel`, `Badge`
2. All spacing/sizing/durations/colors via tokens (no inline literals unless temporary and tracked).
3. Vibe visuals implemented as reusable frame primitives:
- `ColumnFrameOrnament`
- `CardFrameOrnament`
- Controlled by vibe enum + tokenized safe-zones.

## Phase 3: Feature Delivery In Vertical Slices

For each feature, always complete in this order:
1. State contract
2. UI contract
3. Hook/service
4. Visual integration
5. Tests
6. Docs

Never start next feature before step 6 is done for current feature.

## Phase 4: Guardrails (Automated)

Add mandatory CI checks:

1. Type + lint + unit tests
2. Playwright e2e smoke for:
- Drag reorder persist after drop
- Show +5 and reset to 10 scroll targets
- Mobile sidebar open/close and action visibility
- Summary/Research loading indicator visibility
3. Visual regression snapshots (vibes x desktop/mobile)
4. Bundle/perf budget gate for web app

## Specific Actions To Reduce Time Next Time

1. **Write acceptance criteria as test cases before implementation.**
2. **Lock one design pass per vibe using reference screenshots + checklist.**
3. **No new top-level props when context/hook can own them locally.**
4. **Replace all remaining string unions with enums in one dedicated pass.**
5. **Complete i18n migration (`react-i18next`) before adding new user-facing controls.**
6. **Ban inline styling in feature code; use class + token.**
7. **Use "one interaction, one hook" pattern for menu, drag, share, AI actions.**
8. **Adopt "bug class templates" for recurring issues (DnD, overlap, sync).**
9. **Require screenshot diff review for any visual change touching ornaments/borders.**
10. **Keep release cadence fixed (e.g., weekly cut), not ad-hoc after large unstable spans.**

## Suggested Backlog Structure For Next Iteration

1. `infra`: Complete enum/token normalization + no-inline-style cleanup.
2. `architecture`: Final component split and context boundary cleanup.
3. `ux-core`: Stable drag/reorder + menu interaction hardening with e2e tests.
4. `vibes`: Per-vibe ornament/icon finalization under contract and snapshot baselines.
5. `i18n`: Full label migration + BG typography mapping by vibe.
6. `perf`: Render profiling and feed/update throttling validations.
7. `docs`: Keep README high-level; keep implementation changelog in release notes.

## Practical Operating Rules

1. No feature starts without a contract issue/ticket with acceptance criteria.
2. No PR merged without:
- test evidence
- screenshot evidence (if visual)
- release note entry
3. If a fix touches more than one concern, split into sequential commits.
4. If a component exceeds size thresholds, split before adding more behavior.
5. If user feedback indicates mismatch twice, pause and re-baseline contract before more edits.

## Expected Impact If Applied

- 30-50% fewer UI rework cycles
- Faster bug isolation due to smaller responsibility boundaries
- Lower regression rate in drag/mobile/menu flows
- Lower token/time cost from reduced back-and-forth on visual intent

