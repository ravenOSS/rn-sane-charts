# rn-sane-charts Roadmap

Last updated: 2026-02-16

Planning source of truth: this file is the single roadmap/task tracker.

## Goal

Complete MVP with deterministic core architecture, production-safe defaults, and measurable performance.

## Current Snapshot

- Done: core chart set (line, area single + stacked, bar/grouped/stacked, scatter, histogram), responsive chart wrapper, core-based legend layout/hit-test helpers, core stack/downsample transforms.
- Open: scatter spatial indexing, stronger RN tests, perf harness, package/dependency hygiene.

Milestone status:
- M1: Completed
- M2: Completed
- M3: Not Started
- M4: Not Started

## Milestone M1: MVP Architecture Completion

Scope:
- Implement core transforms:
  - `stack` (`packages/core/src/transforms/stack.ts`)
  - `downsample` (`packages/core/src/transforms/downsample.ts`)
- Export transforms in `packages/core/src/transforms/index.ts`.
- Add/expand core tests for transforms and interaction edge cases.

Exit criteria:
- `stack` and `downsample` are implemented, tested, and documented.
- No placeholder transform files remain.
- `pnpm -r typecheck` and `pnpm -r test` pass.

## Milestone M2: Feature Completion (MVP Gaps)

Scope:
- Add stacked area support (core prep + RN renderer + examples + docs).
- Add first-class marker annotations API (minimal, opinionated surface).

Exit criteria:
- Stacked area available in public API and examples app.
- Marker annotations documented and demoed in examples.
- API and user guide reflect shipped behavior.

## Milestone M3: Performance + Interaction Quality

Scope:
- Add scatter spatial indexing in core interaction path.
- Add repeatable performance harness in examples:
  - 5k line points
  - 1k scatter points
- Verify interaction path avoids unnecessary per-frame allocations.

Exit criteria:
- Performance scenarios are scripted/repeatable.
- Baseline perf results are documented.
- Scatter hit-testing uses indexed lookup path (not full linear scan).

## Milestone M4: Packaging + Release Readiness

Scope:
- Package dependency hygiene:
  - align `@rn-sane-charts/rn` dependency declaration for `@rn-sane-charts/core`
  - resolve/document package manager mismatch in `packages/rn/package.json`
- Expand RN tests beyond `it.todo`.
- Sync stale docs (`DEV_TASKS`, codebase analysis artifacts) to current state.

Exit criteria:
- Fresh install and local dev flow are deterministic with documented commands.
- RN has meaningful smoke tests for chart render + legend interaction.
- Status docs are aligned with current codebase.

## Cross-Cutting Rules (All Milestones)

- Keep core deterministic and renderer-agnostic.
- Keep API small; no config sprawl.
- Every non-trivial layout/heuristic algorithm must include function docblocks and inline reasoning comments.
- Every behavior change must include tests and example validation.

## Suggested Execution Order

1. M1 (transforms foundation)
2. M2 (stacked area + annotations)
3. M3 (perf/indexing)
4. M4 (release hardening)

## Risks To Monitor

- Scope creep from annotation API customization.
- Performance regressions from richer interactions.
- Docs drifting behind implementation (already observed once).
