# Dev Tasks (Current)

Last updated: 2026-02-09

## Current Project Status

1. Branch state: `main` is ahead of `origin/main` by 7 commits.
2. Local uncommitted changes:
   - `packages/examples/App.tsx` (uniform wrapped chart-type buttons)
   - `packages/rn/src/Chart.tsx` (plot tap restores all series in legend isolate mode)
   - `.specstory/history/2026-01-25_01-24Z-build-failure.md` (untracked session artifact)
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

1. Recoverable from local history: only implementation/build/debug history in `.specstory/history/`.
2. Not recoverable from local history: a clear competitive design survey of other chart libraries (no durable notes found in `docs/` or tracked markdown).
3. Conclusion: the beautification research exercise should be repeated unless you have external notes.

## Recommended Next Tasks (Priority Order)

1. Create `docs/research/chart-library-survey-2026-02.md`:
   - Compare visual defaults from 4-6 libraries.
   - Extract concrete rules (palette, stroke widths, grid contrast, typography, spacing, legend behavior).
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

