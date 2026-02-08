// packages/core/src/scales/makeTicks.ts

import { ticks as d3Ticks } from "d3-array";
import type { Tick, YTick } from "../model/types";
import { formatNumberDefault } from "../format/number";
import { makeDomainDateFormatter } from "../format/date";

/**
 * Generate y-axis ticks for a linear scale.
 *
 * Core outputs ticks with pixel positions. This keeps layout deterministic.
 */
export function makeYTicks(input: {
  yDomain: [number, number];
  yScale: (v: number) => number;
  count?: number;
  formatY?: (v: number) => string;
}): YTick[] {
  const count = input.count ?? 5;
  const fmt = input.formatY ?? formatNumberDefault;

  const values = d3Ticks(input.yDomain[0], input.yDomain[1], count);
  return values.map((v: number) => ({
    value: v,
    label: fmt(v),
    y: input.yScale(v),
  }));
}

/**
 * Generate x-axis ticks for a time scale.
 *
 * MVP behavior:
 * - Use a fixed tick count heuristic.
 * - Format with a simple default date formatter.
 *
 * Important:
 * - Collision resolution happens later in layout.
 * - This function should NOT attempt rotation/skip logic.
 */
export function makeTimeXTicks(input: {
  xDomain: [Date, Date];
  xScale: (v: Date) => number;
  count?: number;
  formatX?: (d: Date) => string;
}): Tick[] {
  const count = input.count ?? 6;
  const fmt = input.formatX ?? makeDomainDateFormatter(input.xDomain);

  // d3-array ticks doesn't generate Date ticks; use numeric ms ticks then convert.
  const a = input.xDomain[0].getTime();
  const b = input.xDomain[1].getTime();
  const values = d3Ticks(a, b, count).map((ms: number) => new Date(ms));

  return values.map((d: Date) => ({
    value: d,
    label: fmt(d),
    x: input.xScale(d),
  }));
}
