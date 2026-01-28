// packages/core/src/layout/buildTimeSeriesPlan.ts

import type { Series } from "../model/types";
import { validateSeriesInput } from "../validate/validateSeries";
import { computeXDomainTime, computeYDomain } from "../scales/domain";
import { makeTimeSeriesScales } from "../scales/makeScales";
import { makeTimeXTicks, makeYTicks } from "../scales/makeTicks";
import { computeLayout } from "./computeLayout";
import type { LayoutInput } from "./computeLayout";

/**
 * Build a minimal "plan" for a time-series chart:
 * - validate
 * - domains
 * - scales (needs plot, but plot needs layout... so we do a two-pass approach)
 *
 * Two-pass approach rationale:
 * - Layout needs ticks (for collisions) and tick labels need scales.
 * - Scales need plot rect.
 *
 * MVP simplification:
 * - Pass 1: assume plot = full chart minus padding/header (rough)
 * - Compute ticks
 * - Layout resolves collisions and returns final plot rect
 * - Pass 2: rebuild scales/ticks with final plot
 *
 * This keeps the system deterministic and avoids circular dependencies.
 * Future refinement can unify this into a single iterative solver if needed.
 */
export function buildTimeSeriesPlan(args: {
  series: Series[];
  layoutInput: Omit<LayoutInput, "xTicks" | "yTicks">;
  yIncludeZero?: boolean;
  tickCounts?: { x?: number; y?: number };
  formatX?: (d: Date) => string;
  formatY?: (v: number) => string;
}) {
  const diagnostics = validateSeriesInput(args.series);

  const xDomain = computeXDomainTime(args.series);
  const yDomain = computeYDomain(args.series, { includeZero: args.yIncludeZero ?? false });

  // Pass 1: rough plot (use full area; layout will refine)
  const roughPlot = { x: 0, y: 0, width: args.layoutInput.width, height: args.layoutInput.height };
  const roughScales = makeTimeSeriesScales({ plot: roughPlot, xDomain, yDomain });

  const xTicks1 = makeTimeXTicks({
    xDomain,
    xScale: roughScales.x,
    count: args.tickCounts?.x,
    formatX: args.formatX,
  });

  const yTicks1 = makeYTicks({
    yDomain,
    yScale: roughScales.y,
    count: args.tickCounts?.y,
    formatY: args.formatY,
  });

  const layout1 = computeLayout({ ...args.layoutInput, xTicks: xTicks1, yTicks: yTicks1 });

  // Pass 2: final scales using the actual plot region
  const scales = makeTimeSeriesScales({ plot: layout1.plot, xDomain, yDomain });

  const xTicks2 = makeTimeXTicks({
    xDomain,
    xScale: scales.x,
    count: args.tickCounts?.x,
    formatX: args.formatX,
  });

  const yTicks2 = makeYTicks({
    yDomain,
    yScale: scales.y,
    count: args.tickCounts?.y,
    formatY: args.formatY,
  });

  const layout2 = computeLayout({ ...args.layoutInput, xTicks: xTicks2, yTicks: yTicks2 });

  return {
    diagnostics,
    domains: { x: xDomain, y: yDomain },
    scales,
    ticks: { x: layout2.resolvedXAxis.ticks, y: yTicks2 },
    layout: layout2,
  };
}