import type { Series } from '@rn-sane-charts/core';

/**
 * Compute a reasonable bar slot width from x positions.
 *
 * Strategy:
 * - Measure nearest-neighbor spacing between sorted x positions.
 * - Use the tightest gap as the slot width baseline.
 * - Fall back to a conservative constant for sparse/degenerate inputs.
 */
export function computeBarSlotWidthPx(
  seriesList: Series[],
  xScale: (v: any) => number
): number {
  const xs: number[] = [];

  for (const series of seriesList) {
    for (const pt of series.data) {
      const x = xScale(pt.x);
      if (!Number.isFinite(x)) continue;
      xs.push(x);
    }
  }

  if (xs.length < 2) return 24;

  xs.sort((a, b) => a - b);

  let minGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < xs.length; i += 1) {
    const current = xs[i];
    const previous = xs[i - 1];
    if (current === undefined || previous === undefined) continue;
    const gap = current - previous;
    if (gap > 0 && gap < minGap) minGap = gap;
  }

  if (!Number.isFinite(minGap)) return 24;
  return Math.max(6, minGap);
}

export function resolveBaselineYPx(
  yScale: (v: number) => number,
  baselineY?: number
) {
  const y = yScale(baselineY ?? 0);
  return Number.isFinite(y) ? y : yScale(0);
}
