// packages/core/src/geometry/points.ts

import type { Point, Series } from "../model/types";

/**
 * Convert a series into pixel-space points.
 * Used for:
 * - scatter plots
 * - markers
 * - hit-testing indices
 */
export function buildPoints(series: Series, scales: { x: (v: any) => number; y: (v: number) => number }): Point[] {
  const out: Point[] = [];
  for (const pt of series.data) {
    const x = scales.x(pt.x);
    const y = scales.y(pt.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({ x, y });
  }
  return out;
}