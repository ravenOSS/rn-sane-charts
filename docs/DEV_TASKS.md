# Dev Tasks (Current)

Last updated: 2026-02-09

## Current Project Status

1. Branch state: `main` is in sync with `origin/main`.
2. Local uncommitted changes: check with `git status` before cutting a release tag.
3. Validation status:
   - `pnpm -r typecheck` passes.
   - `pnpm -r test` passes for `core`; `rn` test file is still skipped/todo.

## What Is Implemented (High Confidence)

1. Core chart renderers in RN: line, area (single), bar, grouped bar, stacked bar, scatter, histogram.
2. Shared chart features: title/subtitle, axis titles, tick layout decisions, legend rendering/placement, tooltip/crosshair interactions.
3. Example gallery for all MVP chart types plus accessibility theme check.

## Open Gaps vs PRD / Architecture

1. Core interaction math is not implemented yet:
   - `packages/core/src/interaction/hitTestLine.ts` is empty.
   - `packages/core/src/interaction/hitTestScatter.ts` is empty.
   - `packages/core/src/interaction/hitTestBars.ts` is empty.
2. Stacked area is still not implemented (`API.md` currently marks area as partially implemented).
3. Marker annotations API is not present yet as a first-class chart feature.
4. RN package tests are thin (`src/__tests__/index.test.tsx` remains skipped).
5. Performance targets are documented but not backed by repeatable benchmark scripts in-repo.
6. Legend placement logic currently lives in RN; architecture intent in docs still emphasizes layout decisions in core.

## Beautification Research Recovery

1. Recoverable from local history:
   - Skia text/font implementation notes (`matchFont`, system fonts, paragraph fallback).
   - Expo/RN environment and stability notes (SDK 55, bridgeless/dev-client issues).
2. Not recoverable from local history:
   - A concrete competitive survey of chart libraries for UX/DX guidance.
   - A preserved set of "beautification rules" derived from other libraries.
3. Conclusion:
   - We should repeat competitive chart-library research unless external notes exist.
   - Use recovered Skia notes to constrain implementation choices (text measurement and fallback behavior) during that research.

## Recommended Next Tasks (Priority Order)

1. Run a fresh competitive research pass and document it in `docs/research/chart-library-survey-2026-02.md`:
   - Compare visual defaults and API ergonomics from 4-6 libraries.
   - Separate findings into `DX` (API shape, defaults, onboarding) and `UX` (readability, legend/tooltips, density heuristics).
   - Convert findings into explicit acceptance rules for this Skia-first codebase.
2. Implement stacked area renderer:
   - Add core stacking path support where needed.
   - Add RN renderer + example panel + tests.
3. Move/duplicate interaction hit-test math into `@rn-sane-charts/core`:
   - Line nearest-point.
   - Scatter nearest-point with spatial bucketing.
   - Bar hit regions.
4. Add marker annotations API:
   - Minimal prop surface aligned to PRD.
   - Examples and tests.
5. Add lightweight perf harness in examples:
   - 5k line points and 1k scatter points scenarios.
   - Capture FPS/memory snapshots as repeatable dev checks.
6. Add `docs/research/skia-constraints.md`:
   - Capture recovered constraints from history (font loading, text measurement strategy, fallback behavior).
   - Tie chart beautification rules to what is practical in Skia + RN.
