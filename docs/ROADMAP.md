# rn-sane-charts Roadmap

Last updated: 2026-02-22

Planning source of truth: this file is the single roadmap/task tracker.

## Goal

Ship a solid MVP baseline with:

- deterministic core architecture
- readable default visuals on mobile
- documented, test-backed behavior
- predictable package/dev workflow

## Current Status

- Completed: core chart set (line, area/stacked area, bar/grouped/stacked, scatter, histogram renderer), responsive chart wrapper, legend layout/hit testing, stack/downsample transforms, scatter spatial index, perf harness + baseline docs.
- Completed: visual correctness fixes (x-label anchor alignment, multi-series palette progression, gridline rendering from `theme.grid`).
- Completed: RN smoke tests under Vitest (chart render scaffolding + interaction responder path).
- Completed: package/dependency hygiene for `@rn-sane-charts/rn` (workspace dependency declaration + pnpm-aligned package metadata).
- Completed: examples interaction parity across gallery chart views.
- Open: design-target theming evolution (`focus`/`muted` state tokens), optional interaction model refinement beyond current `toggle`/`isolate`, and broader MVP polish.

## MVP Push (Current)

This push is focused on making MVP feel production-safe without expanding scope.

### In Scope (Execution Complete)

1. Visual correctness and consistency

   - Completed: aligned x-axis rotated-label collision math and renderer anchoring.
   - Completed: multi-series defaults now use palette progression by series index.
   - Completed: gridline rendering wired to `theme.grid` tokens.

2. Interaction behavior baseline

   - Completed: kept existing legend `toggle`/`isolate` modes for compatibility.
   - Completed: docs/examples emphasize focus + de-emphasis as preferred comparison pattern.
   - Completed: interaction path remains allocation-safe in core/RN tests and perf harness baseline.

3. Histogram ergonomics clarification

   - Completed: kept current renderer contract (`HistogramSeries` consumes bins).
   - Completed: kept core binning (`binHistogram`) as the standard path and documented flow consistently.

4. Release hardening

   - Completed: added RN smoke tests (render + interaction path) under Vitest.
   - Completed: resolved package/dependency hygiene items in `@rn-sane-charts/rn`.
   - Completed: validated deterministic local workflow (`pnpm -r typecheck`, `pnpm -r test`, examples iOS launch/install).

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

## Next Execution Order

1. Decide whether to introduce first-class theme state tokens (`focus`/`muted`) in public API or keep policy-only guidance for MVP.
2. If theme state tokens are deferred, add explicit examples of focus+de-emphasis behavior using current API surface.
3. Expand RN smoke coverage to include legend tap mode assertions (`toggle` and `isolate`) in addition to current interaction responder coverage.
4. Prepare MVP release checklist (versioning, changelog, publish dry-run).

## Publish Readiness Checklist

Use this as a strict go/no-go gate before publishing to npm.

1. Versioning and changelog

   - Package versions are set intentionally (`core` and `rn`), not placeholder values.
   - Changelog/release notes summarize shipped behavior and known limitations.

2. Package artifact integrity

   - `main`, `module`, `types`, and `exports` resolve correctly from built output.
   - `npm pack`/`pnpm pack` tarballs include required runtime files only.

3. Dependency and peer contract

   - Runtime dependencies are fully declared (no hidden workspace-only imports).
   - `peerDependencies` are accurate for consumer React Native projects.

4. External consumer validation

   - Fresh project (outside monorepo) can install packaged artifacts.
   - TypeScript compile succeeds in consumer setup.
   - iOS simulator build succeeds.
   - Android build succeeds.

5. Monorepo quality gate

   - `pnpm -r typecheck` passes.
   - `pnpm -r test` passes.
   - Examples app launches and basic interactions are verified.

6. Publish workflow dry-run

   - Release command path is documented and reproducible.
   - At least one dry-run publish flow is executed before real publish.

## Risks To Monitor

- Scope creep from theming redesign requests.
- Regressions from label collision/anchor changes.
- Interaction complexity growth while trying to add focus+mute semantics.
- Docs drifting from implementation after rapid fixes.
