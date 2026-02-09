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

/**
 * Generate x-axis ticks at explicit Date values.
 *
 * Why:
 * - Category-like charts often project labels onto synthetic time slots.
 * - Auto-generated domain ticks can drift from those slots, causing labels
 *   to appear missing or misaligned under bars/groups.
 *
 * This function guarantees one tick candidate per provided value (after
 * dedupe/sort), then collision logic may still skip some for readability.
 */
export function makeTimeXTicksFromValues(input: {
  values: Date[];
  xScale: (v: Date) => number;
  formatX?: (d: Date) => string;
  xDomain?: [Date, Date];
}): Tick[] {
  const unique = new Map<number, Date>();
  for (const d of input.values) {
    const t = d.getTime();
    if (!Number.isFinite(t)) continue;
    if (!unique.has(t)) unique.set(t, d);
  }

  const values = Array.from(unique.values()).sort(
    (a, b) => a.getTime() - b.getTime()
  );
  if (values.length === 0) return [];

  const domainForFormat =
    input.xDomain ?? [values[0] as Date, values[values.length - 1] as Date];
  const fmt = input.formatX ?? makeDomainDateFormatter(domainForFormat);

  return values.map((d) => ({
    value: d,
    label: fmt(d),
    x: input.xScale(d),
  }));
}
