import type { Series } from '@rn-sane-charts/core';

export type BarDensity = {
  slotWidthPx: number;
  categoryCount: number;
};

export type GroupedBarGeometry = {
  groupWidthPx: number;
  barWidthPx: number;
  innerGapPx: number;
};

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
  return computeBarDensity(seriesList, xScale).slotWidthPx;
}

/**
 * Resolve the x-density inputs needed by bar width heuristics.
 *
 * Why this exists:
 * - Width decisions need two signals: the projected slot width and rough category
 *   count. Slot width alone overestimates bar thickness for sparse datasets.
 * - Category count is inferred from unique projected x-positions so this stays
 *   renderer-driven and does not assume a specific datum type.
 */
export function computeBarDensity(
  seriesList: Series[],
  xScale: (v: any) => number
): BarDensity {
  const xs: number[] = [];

  for (const series of seriesList) {
    for (const pt of series.data) {
      const x = xScale(pt.x);
      if (!Number.isFinite(x)) continue;
      xs.push(x);
    }
  }

  if (xs.length === 0) return { slotWidthPx: 24, categoryCount: 1 };
  if (xs.length === 1) return { slotWidthPx: 24, categoryCount: 1 };

  xs.sort((a, b) => a - b);
  const uniqueX = dedupeCloseSortedValues(xs, 0.5);

  let minGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < uniqueX.length; i += 1) {
    const current = uniqueX[i];
    const previous = uniqueX[i - 1];
    if (current === undefined || previous === undefined) continue;
    const gap = current - previous;
    if (gap > 0 && gap < minGap) minGap = gap;
  }

  const slotWidthPx = !Number.isFinite(minGap) ? 24 : Math.max(6, minGap);
  return {
    slotWidthPx,
    categoryCount: Math.max(1, uniqueX.length),
  };
}

/**
 * Resolve a single-bar/stacked-bar width from slot density.
 *
 * Human reasoning:
 * - Bars should generally be wider than the gaps between them ("Goldilocks").
 * - Sparse charts need narrower occupancy to avoid chunky bars.
 * - Dense charts need wider occupancy to keep bars legible.
 *
 * Invariants:
 * - Width is clamped to avoid extremes on both tiny and very wide charts.
 * - A minimum inter-bar gap is preserved when slot width permits.
 */
export function resolveAutoBarWidthPx({
  slotWidthPx,
  categoryCount,
  minBarPx = 2,
  maxBarPx = 42,
  minGapPx = 2,
}: {
  slotWidthPx: number;
  categoryCount: number;
  minBarPx?: number;
  maxBarPx?: number;
  minGapPx?: number;
}): number {
  if (!Number.isFinite(slotWidthPx) || slotWidthPx <= 0) return 12;
  const occupancy = resolveBarOccupancy(categoryCount);
  const rawWidth = slotWidthPx * occupancy;
  const clampedWidth = clamp(rawWidth, minBarPx, maxBarPx);
  const maxWidthForGap = Math.max(minBarPx, slotWidthPx - minGapPx);
  return clamp(clampedWidth, minBarPx, maxWidthForGap);
}

/**
 * Resolve grouped-bar geometry from the shared category slot.
 *
 * Why separate from series render code:
 * - Grouped bars need an additional inner-gap policy that should be consistent
 *   across all grouped examples and themes.
 * - Keeping this in one function makes the heuristic testable and easy to tune.
 */
export function resolveAutoGroupedBarGeometry({
  slotWidthPx,
  categoryCount,
  seriesCount,
  minBarPx = 2,
}: {
  slotWidthPx: number;
  categoryCount: number;
  seriesCount: number;
  minBarPx?: number;
}): GroupedBarGeometry {
  const safeSeriesCount = Math.max(1, Math.floor(seriesCount));
  const groupWidthPx = resolveAutoBarWidthPx({
    slotWidthPx,
    categoryCount,
    minBarPx: Math.max(minBarPx * safeSeriesCount, 4),
    maxBarPx: 52,
  });
  if (safeSeriesCount === 1) {
    return {
      groupWidthPx,
      barWidthPx: groupWidthPx,
      innerGapPx: 0,
    };
  }

  // Keep small visual separation between bars in a group without wasting width.
  const targetInnerGapPx = clamp(groupWidthPx * 0.12, 1, 6);
  const maxInnerGapPx =
    (groupWidthPx - safeSeriesCount * minBarPx) / (safeSeriesCount - 1);
  const innerGapPx = Math.max(0, Math.min(targetInnerGapPx, maxInnerGapPx));
  const availableWidthPx =
    groupWidthPx - innerGapPx * Math.max(0, safeSeriesCount - 1);
  const barWidthPx = availableWidthPx / safeSeriesCount;

  if (barWidthPx >= minBarPx) {
    return {
      groupWidthPx,
      barWidthPx,
      innerGapPx,
    };
  }

  // Degenerate fallback for very dense groups: drop inner gaps before shrinking bars.
  return {
    groupWidthPx,
    barWidthPx: Math.max(1, groupWidthPx / safeSeriesCount),
    innerGapPx: 0,
  };
}

export function resolveBaselineYPx(
  yScale: (v: number) => number,
  baselineY?: number
) {
  const y = yScale(baselineY ?? 0);
  return Number.isFinite(y) ? y : yScale(0);
}

function resolveBarOccupancy(categoryCount: number): number {
  if (!Number.isFinite(categoryCount) || categoryCount <= 4) return 0.46;
  if (categoryCount >= 12) return 0.7;
  const t = (categoryCount - 4) / 8;
  return 0.46 + t * (0.7 - 0.46);
}

function dedupeCloseSortedValues(values: number[], epsilon: number): number[] {
  if (values.length <= 1) return values.slice();
  const unique: number[] = [values[0] ?? 0];
  for (let i = 1; i < values.length; i += 1) {
    const current = values[i];
    const previous = unique[unique.length - 1];
    if (current === undefined || previous === undefined) continue;
    if (Math.abs(current - previous) > epsilon) unique.push(current);
  }
  return unique;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
