# Cross-Agent Execution Rules (Claude / Gemini / Codex)

Use this file as a project-level operating contract for AI coding agents.
Goal: reduce rework, regressions, and back-and-forth by enforcing clear delivery rules.

## 1) Core Principles

1. Build for correctness first, aesthetics second, speed third.
2. Never claim completion without verifiable evidence.
3. Prefer small, testable, reversible changes over large rewrites.
4. Keep logic explicit; avoid hidden coupling and duplicated ownership.
5. If requirements conflict, ask for prioritization once, then execute.

## 2) Required Pre-Work (Before Implementation)

Create and lock these artifacts before feature work:

1. `UI Contract`
- exact behavior for key interactions
- desktop + mobile rules
- edge cases and failure modes

2. `Design Contract`
- visual language per mode/theme
- explicit allowed/forbidden patterns
- screenshot references and acceptance criteria

3. `State Ownership Contract`
- one owner per concern (store/context/local state)
- no dual ownership between old/new paths

4. `Definition of Done`
- functional checks
- visual checks
- test checks
- performance checks

If these are missing, agent must create draft versions first.

## 3) Architecture Rules

1. One component = one responsibility.
2. Page/container components orchestrate; hooks/services execute logic.
3. Use context only for shared cross-section concerns.
4. Do not pass props downward unless consumed by that child or multiple siblings.
5. Eliminate bridge/legacy state paths before adding net-new features.

## 4) Component Size Limits

Hard thresholds:

1. Leaf UI components: target <= 150 lines.
2. Container components: target <= 250 lines.
3. If threshold exceeded, split before adding behavior.

## 5) Styling and Design System

1. Use design tokens for spacing, sizing, color, radius, timing.
2. No magic numbers in feature code when a token can exist.
3. No inline styles unless temporary and tracked by TODO ticket.
4. Theme/mode differences must change shape language and component treatment, not only color.
5. Keep content readability invariant (ornaments/background effects must never overlap text).

## 6) Types, Enums, Constants

1. Replace literal unions and string comparisons with enums/constants.
2. Centralize option lists and labels in dedicated constants.
3. Keep domain models in shared type modules.
4. Avoid duplicate type aliases for same domain concept.

## 7) State and Effects

1. Prefer derived state and event handlers over extra `useEffect`.
2. Move repeated effect patterns to custom hooks.
3. Keep effects side-effect-only (persistence, subscriptions, DOM sync).
4. If an effect writes and reads same domain state, review for reducer/action redesign first.

## 8) Feature Delivery Sequence (Vertical Slice)

For each feature, implement in this exact order:

1. state contract + actions/selectors
2. service/hook logic
3. UI integration
4. tests (unit + interaction/e2e as needed)
5. docs + release notes

Do not start next feature until all 5 are done.

## 9) Testing and Quality Gates

Minimum required gates:

1. Typecheck and lint pass.
2. Unit tests for reducers/hooks/services touched.
3. Interaction tests for high-risk UX flows (drag/drop, menu, toggles, async states).
4. Visual snapshot checks for themed/mode UI changes.
5. Performance sanity check for rendering-heavy screens.

No merge if any gate fails.

## 10) Git and Commit Discipline

1. One logical change per commit.
2. Commit message format: `type(scope): concise change`.
3. Include evidence in PR/summary:
- what changed
- why
- how validated
- screenshots (if visual)
4. Update release notes per commit-level change.
5. Update README only for significant user-facing or operational changes.

## 11) Communication Rules For Agents

1. State exact next action before executing.
2. Report blockers with concrete cause and proposed fix.
3. Never say “done” without test/build/status evidence.
4. If a previous approach failed twice, stop and present revised plan with tradeoffs.
5. Keep status updates short and factual.

## 12) UI/UX Specific Guardrails

1. Never let decorative layers interfere with interaction or readability.
2. For themed modes, define:
- border geometry
- icon set
- ornament set
- typography pairing
- component accents
3. Mobile must be designed intentionally (not desktop collapse-only).
4. High-frequency controls should be discoverable and uncluttered.

## 13) Performance Guardrails

1. Avoid unnecessary rerenders via memoized selectors and component boundaries.
2. Use batching/debouncing for bursty streams/events.
3. Virtualize or lazy-hydrate large lists/columns.
4. Provide a performance mode that disables non-essential effects.

## 14) Portable Prompt Block (Paste Into Any Agent)

Use this as a top instruction in Claude/Gemini/Codex:

1. Follow `CROSS_AGENT_EXECUTION_RULES.md` strictly.
2. Do not implement without locked contracts (UI/design/state/DoD).
3. Split large components before adding new behavior.
4. Use enums/constants/tokens; avoid magic numbers and inline styles.
5. Prefer hooks/services/context over effect-heavy component logic.
6. For visual changes, attach screenshot evidence and ensure readability.
7. Run all quality gates before declaring done.
8. Commit small, push frequently, and summarize with validation proof.

## 15) Enforcement Checklist (Per Task)

- [ ] Contracts checked or created
- [ ] Ownership unambiguous
- [ ] Component size limits respected
- [ ] Tokens/enums/constants used
- [ ] Tests added/updated
- [ ] Build/lint/typecheck pass
- [ ] Visual proof included (if UI changed)
- [ ] Release notes updated

