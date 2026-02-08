// packages/core/src/scales/domain.ts

import type { DomainNumber, DomainDate, Series } from "../model/types";
import { tickStep } from "d3-array";

/**
 * Compute numeric y-domain across all series.
 *
 * Important:
 * - Returns [min, max] including 0 if includeZero is true (bar chart default).
 * - If data is empty or invalid, returns a safe default.
 */
export function computeYDomain(series: Series[], opts?: { includeZero?: boolean }): DomainNumber {
  const includeZero = opts?.includeZero ?? false;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const s of series) {
    for (const pt of s.data) {
      const y = pt.y;
      if (!Number.isFinite(y)) continue;
      if (y < min) min = y;
      if (y > max) max = y;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];

  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }

  // Avoid degenerate domains (min === max).
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
    return [min - pad, max + pad];
  }

  /**
   * Add visual headroom/footroom and snap to "nice" bounds.
   *
   * Why:
   * - If we use the raw [min,max], top ticks can sit at/below the highest point.
   * - Nice bounds make axis values more readable and avoid line/axis overlap.
   *
   * Heuristic:
   * - 8% padding on each side
   * - Snap to a 5-tick-friendly step
   * - Guarantee upper bound is strictly above observed max
   */
  const span = max - min;
  const paddedMin = min - span * 0.08;
  const paddedMax = max + span * 0.08;

  const step = tickStep(paddedMin, paddedMax, 5);
  const niceMin = Math.floor(paddedMin / step) * step;
  let niceMax = Math.ceil(paddedMax / step) * step;

  if (niceMax <= max) {
    niceMax += step;
  }

  if (includeZero) {
    return [Math.min(niceMin, 0), Math.max(niceMax, 0)];
  }

  return [niceMin, niceMax];
}

/**
 * Compute x-domain for time-series.
 *
 * Assumes x is Date or number. For Date, uses min/max by time.
 */
export function computeXDomainTime(series: Series[]): DomainDate {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const s of series) {
    for (const pt of s.data) {
      const x = pt.x;
      const t = x instanceof Date ? x.getTime() : (typeof x === "number" ? x : NaN);
      if (!Number.isFinite(t)) continue;
      if (t < min) min = t;
      if (t > max) max = t;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    const now = Date.now();
    return [new Date(now - 86_400_000), new Date(now)];
  }

  if (min === max) {
    // Expand by one day when single-point.
    return [new Date(min - 43_200_000), new Date(max + 43_200_000)];
  }

  return makeNiceTimeDomain([min, max]);
}

/**
 * Expand and "nice" a time domain so boundary ticks can land outside raw data.
 *
 * Why:
 * - Raw [min,max] often puts the first/last point directly on axis boundaries.
 * - A small pad plus step snapping yields cleaner charts and typically produces
 *   a boundary tick beyond the observed data range.
 *
 * Invariant:
 * - Returned max is strictly greater than observed max.
 * - Returned min is strictly less than observed min.
 */
function makeNiceTimeDomain(rawMsDomain: [number, number]): DomainDate {
  const [rawMin, rawMax] = rawMsDomain;
  const span = Math.max(1, rawMax - rawMin);

  // A light 4% pad keeps the domain visually honest while reducing edge crowding.
  const paddedMin = rawMin - span * 0.04;
  const paddedMax = rawMax + span * 0.04;

  const step = tickStep(paddedMin, paddedMax, 6);
  let niceMin = Math.floor(paddedMin / step) * step;
  let niceMax = Math.ceil(paddedMax / step) * step;

  if (niceMin >= rawMin) {
    niceMin -= step;
  }
  if (niceMax <= rawMax) {
    niceMax += step;
  }

  return [new Date(niceMin), new Date(niceMax)];
}
