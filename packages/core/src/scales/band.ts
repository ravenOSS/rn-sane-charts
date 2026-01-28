// packages/core/src/scales/band.ts

import { scaleBand } from "d3-scale";
import type { PixelRange, ScaleFn } from "./scaleTypes";

/**
 * Create a band scale for categorical axes.
 *
 * This is commonly used for bar charts.
 */
export function createBandScale(domain: Array<string | number>, range: PixelRange, paddingInner = 0.1) {
  const s = scaleBand().domain(domain.map(String)).range(range).paddingInner(paddingInner);

  const fn = ((v: string | number) => {
    const px = s(String(v));
    // For band scales, the value maps to the start position of the band.
    // Callers often want the band center; we keep both:
    return px ?? NaN;
  }) as ScaleFn<string | number>;

  return {
    scale: fn,
    bandwidth: () => s.bandwidth(),
    /** Center of band is useful for label positioning. */
    center: (v: string | number) => {
      const start = s(String(v));
      return start == null ? NaN : start + s.bandwidth() / 2;
    },
  };
}