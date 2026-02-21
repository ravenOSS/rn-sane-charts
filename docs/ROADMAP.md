# rn-sane-charts Roadmap

Last updated: 2026-02-21

Planning source of truth: this file is the single roadmap/task tracker.

## Goal

Ship a solid MVP baseline with:
- deterministic core architecture
- readable default visuals on mobile
- documented, test-backed behavior
- predictable package/dev workflow

## Current Status

- Completed: core chart set (line, area/stacked area, bar/grouped/stacked, scatter, histogram renderer), responsive chart wrapper, legend layout/hit testing, stack/downsample transforms, scatter spatial index, perf harness + baseline docs.
- Completed: doc harmonization for current behavior (`DESIGN_GUIDE`, `PRD`, `API`, `USER_GUIDE`).
- Open: visual/theming behavior gaps, RN test coverage, release-hardening work.

## MVP Push (Current)

This push is focused on making MVP feel production-safe without expanding scope.

### In Scope

1. Visual correctness and consistency
- Align x-axis rotated-label collision math and renderer anchoring so overlap decisions are reliable.
- Ensure multi-series defaults use palette progression by series index (not all series defaulting to palette slot 0).
- Wire gridline rendering to existing `theme.grid` tokens (currently tokenized but not rendered).

2. Interaction behavior baseline
- Keep existing legend `toggle`/`isolate` modes for compatibility.
- Add clear docs/examples that prefer focus + de-emphasis as the default comparison pattern.
- Ensure tooltip/legend interactions remain allocation-safe during gestures.

3. Histogram ergonomics clarification
- Keep current renderer contract (`HistogramSeries` consumes bins).
- Keep core binning as the standard path (`binHistogram`), with examples/docs showing this flow consistently.

4. Release hardening
- Add meaningful RN smoke tests (render + legend interaction + one interaction path).
- Resolve package/dependency hygiene items in `@rn-sane-charts/rn`.
- Confirm deterministic local workflow (`pnpm install`, `pnpm -r typecheck`, `pnpm -r test`).

### Exit Criteria

- Visual regressions addressed for the three top gaps:
  - x-label anchor mismatch fixed
  - multi-series palette defaults fixed
  - gridlines rendered from theme tokens
- RN tests no longer rely on `it.todo` only.
- Core/RN typecheck and tests pass in CI-equivalent local run.
- Examples app demonstrates and validates shipped behavior.
- Docs remain aligned with shipped behavior after code changes.

## Skipped In This Push

These are intentionally deferred to protect MVP scope:

1. New public theming API surface
- No new first-class `state.focus` / `state.muted` tokens yet.
- No theme schema redesign (keep current `background/frame/grid/axis/series` shape).

2. Interaction model redesign
- No replacement of `toggle`/`isolate` with a brand-new legend interaction API.
- No large interaction state-machine rewrite.

3. New chart types or renderer targets
- No horizontal bar series in this push.
- No web renderer.
- No financial/candlestick charts.

4. Advanced feature work
- No zoom/brush/pan feature set.
- No full accessibility compliance pass (keep practical readability checks only).
- No major perf architecture rewrite beyond regression prevention.

## Execution Order

1. Fix visual correctness gaps (x-label anchor, palette indexing, grid rendering).
2. Add/upgrade RN tests to lock behavior.
3. Complete package/dependency hygiene.
4. Verify examples + docs alignment and run full validation commands.

## Risks To Monitor

- Scope creep from theming redesign requests.
- Regressions from label collision/anchor changes.
- Interaction complexity growth while trying to add focus+mute semantics.
- Docs drifting from implementation after rapid fixes.
