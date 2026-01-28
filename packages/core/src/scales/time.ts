// packages/core/src/scales/time.ts

import { scaleTime } from "d3-scale";
import type { PixelRange, InvertibleScaleFn } from "./scaleTypes";

/**
 * Create a time scale mapping Date domain to pixel range.
 *
 * We use Date objects at the public boundary for clarity.
 */
export function createTimeScale(domain: [Date, Date], range: PixelRange): InvertibleScaleFn<Date> {
  const s = scaleTime().domain(domain).range(range);
  const fn = ((v: Date) => s(v)) as InvertibleScaleFn<Date>;
  fn.invert = (px: number) => s.invert(px);
  return fn;
}