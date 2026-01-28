// packages/core/src/scales/domain.ts

import type { DomainNumber, DomainDate, Series } from "../model/types";

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

  return [min, max];
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

  return [new Date(min), new Date(max)];
}