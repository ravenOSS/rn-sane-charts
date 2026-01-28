// packages/core/src/scales/linear.ts

import { scaleLinear } from "d3-scale";
import type { Domain, PixelRange, InvertibleScaleFn } from "./scaleTypes";

/**
 * Create a linear scale mapping a numeric domain to a pixel range.
 *
 * Notes:
 * - This is a thin wrapper around d3-scale to keep d3 usage contained.
 * - The returned function is invertible (px → value), which is useful for tooltips.
 */
export function createLinearScale(domain: Domain, range: PixelRange): InvertibleScaleFn<number> {
  const s = scaleLinear().domain(domain).range(range);
  const fn = ((v: number) => s(v)) as InvertibleScaleFn<number>;
  fn.invert = (px: number) => s.invert(px);
  return fn;
}