# rn-sane-charts Performance Baseline

Last updated: 2026-02-16

## Harness Command

Run from repo root:

```bash
pnpm --filter examples perf:harness
```

What it runs:
- Builds `@rn-sane-charts/core`
- Executes deterministic interaction scenarios in `packages/examples/scripts/perf-harness.mjs`

## Scenarios

- `line-index-snap-5k`: 5,000 line points with index-snap interaction flow
- `scatter-nearest-linear-1k`: 1,000 scatter points using linear nearest search
- `scatter-nearest-indexed-1k`: 1,000 scatter points using core spatial index

## Baseline Results (2026-02-16)

Host run: local development machine

| Scenario | Iterations | Total (ms) | Avg (ms/op) |
| --- | ---: | ---: | ---: |
| `line-index-snap-5k` | 1500 | 11.44 | 0.0076 |
| `scatter-nearest-linear-1k` | 1500 | 8.62 | 0.0057 |
| `scatter-nearest-indexed-1k` | 1500 | 5.84 | 0.0039 |

## Notes

- Use this file as a relative baseline for regression checks.
- Absolute timings vary by runtime/device; relative deltas matter most.
