// packages/core/src/layout/buildTimeSeriesPlan.ts

import type { Series } from "../model/types";
import { validateSeriesInput } from "../validate/validateSeries";
import { computeXDomainTime, computeYDomain } from "../scales/domain";
import { makeTimeSeriesScales } from "../scales/makeScales";
import {
  makeTimeXTicks,
  makeTimeXTicksFromValues,
  makeYTicks,
} from "../scales/makeTicks";
import { computeLayout } from "./computeLayout";
import type { LayoutInput } from "./computeLayout";
import { makeDomainDateFormatter } from "../format/date";

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
  xTickValues?: Date[];
  xTickDomainMode?: "slots" | "exact";
  formatX?: (d: Date) => string;
  formatY?: (v: number) => string;
}) {
  const diagnostics = validateSeriesInput(args.series);

  const xTickCount =
    args.tickCounts?.x ?? estimateTimeXTickCount(args.layoutInput.width);
  const explicitTickValues = args.xTickValues?.length
    ? applyExplicitTickBudget({
        values: args.xTickValues,
        requestedCount: xTickCount,
        mode: args.xTickDomainMode ?? "slots",
        chartWidthPx: args.layoutInput.width,
        measureText: args.layoutInput.measureText,
        tickFont: args.layoutInput.xAxis.tickFont,
        formatX: args.formatX,
      })
    : undefined;

  /**
   * Domain order is intentional:
   * - We pick an x tick budget first (screen-width dependent),
   * - then build ticks from a padded/nice time domain.
   *
   * This keeps boundary ticks stable and gives the collision resolver a
   * predictable candidate set for 0°/45°/90° label decisions.
   */
  const xDomain =
    args.xTickValues?.length
      ? computeTimeDomainFromExplicitTicks(
        args.xTickValues,
        args.xTickDomainMode ?? "slots"
      )
      : computeXDomainTime(args.series);
  const yDomain = computeYDomain(args.series, { includeZero: args.yIncludeZero ?? false });

  // Pass 1: rough plot (use full area; layout will refine)
  const roughPlot = { x: 0, y: 0, width: args.layoutInput.width, height: args.layoutInput.height };
  const roughScales = makeTimeSeriesScales({ plot: roughPlot, xDomain, yDomain });

  const xTicks1 = explicitTickValues?.length
    ? makeTimeXTicksFromValues({
        values: explicitTickValues,
        xScale: roughScales.x,
        formatX: args.formatX,
        xDomain,
      })
    : makeTimeXTicks({
        xDomain,
        xScale: roughScales.x,
        count: xTickCount,
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

  const xTicks2 = explicitTickValues?.length
    ? makeTimeXTicksFromValues({
        values: explicitTickValues,
        xScale: scales.x,
        formatX: args.formatX,
        xDomain,
      })
    : makeTimeXTicks({
        xDomain,
        xScale: scales.x,
        count: xTickCount,
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

/**
 * Estimate a readable x-tick count from chart width.
 *
 * Why:
 * - Fixed tick counts can over-densify narrow mobile charts and force 90° labels.
 * - A width-based heuristic gives collision resolver a better starting point
 *   so 0°/45° labels remain viable more often.
 *
 * Heuristic:
 * - Budget ~72px per tick label slot on mobile.
 * - Clamp to a practical range for business charts.
 */
function estimateTimeXTickCount(chartWidthPx: number): number {
  const estimated = Math.floor(chartWidthPx / 62);
  return Math.max(5, Math.min(10, estimated));
}

/**
 * Build a time domain from explicit x tick values.
 *
 * Why this differs from generic `computeXDomainTime`:
 * - Generic time-series domains add nice/padded bounds for continuous charts.
 * - Category-like charts projected onto time slots need tighter edge behavior
 *   so first/last groups don't appear overly indented from the axes.
 *
 * Strategy:
 * - Sort + dedupe tick timestamps.
 * - Expand domain by half of the minimum adjacent slot spacing.
 *   This keeps full bars/groups visible while preserving alignment.
 */
function computeTimeDomainFromExplicitTicks(
  values: Date[],
  mode: "slots" | "exact"
): [Date, Date] {
  const times = Array.from(
    new Set(
      values
        .map((d) => d.getTime())
        .filter((t) => Number.isFinite(t))
    )
  ).sort((a, b) => a - b);

  if (times.length === 0) {
    return computeXDomainTime([]);
  }
  if (times.length === 1) {
    const t = times[0] as number;
    return [new Date(t - 43_200_000), new Date(t + 43_200_000)];
  }

  if (mode === "exact") {
    return [new Date(times[0] as number), new Date(times[times.length - 1] as number)];
  }

  let minGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < times.length; i += 1) {
    const gap = (times[i] as number) - (times[i - 1] as number);
    if (gap > 0 && gap < minGap) minGap = gap;
  }

  const halfStep = Number.isFinite(minGap) ? minGap / 2 : 43_200_000;
  const min = (times[0] as number) - halfStep;
  const max = (times[times.length - 1] as number) + halfStep;
  return [new Date(min), new Date(max)];
}

/**
 * Downsample explicit tick candidates to a practical budget.
 *
 * Why:
 * - Callers may provide one tick candidate per datum (e.g. 50+ daily points).
 * - Feeding every candidate into layout produces dense/low-value labels on
 *   mobile screens and increases collision churn.
 *
 * Rule:
 * - Keep first and last.
 * - Evenly sample interior ticks up to the requested budget.
 */
function applyExplicitTickBudget(input: {
  values: Date[];
  requestedCount: number;
  mode: "slots" | "exact";
  chartWidthPx: number;
  measureText: LayoutInput["measureText"];
  tickFont: LayoutInput["xAxis"]["tickFont"];
  formatX?: (d: Date) => string;
}): Date[] {
  const { values } = input;
  if (values.length <= 2) return values;
  const formatter =
    input.formatX ??
    makeDomainDateFormatter([values[0] as Date, values[values.length - 1] as Date]);

  const sampled = sampleEvenly(values, Math.min(values.length, 10));
  const maxLabelWidth = sampled.reduce((max, d) => {
    const measured = input.measureText({
      text: formatter(d),
      font: input.tickFont,
      angle: 0,
    });
    return Math.max(max, measured.width);
  }, 0);

  // Exact mode (line/area) can tolerate denser x labels than slot charts.
  const minSpacingPx =
    input.mode === "exact"
      ? Math.max(40, maxLabelWidth * 0.75 + 8)
      : Math.max(54, maxLabelWidth + 12);
  const measuredBudget = Math.max(
    2,
    Math.floor(input.chartWidthPx / Math.max(1, minSpacingPx))
  );
  const cap = input.mode === "exact" ? 12 : 10;
  const floor = input.mode === "exact" ? 6 : 4;
  const budget = Math.max(
    floor,
    Math.min(values.length, cap, Math.max(input.requestedCount, measuredBudget))
  );

  if (values.length <= budget) return values;

  const out = sampleEvenly(values, budget);

  // Deduplicate in case rounding collapsed adjacent slots.
  const byTime = new Map<number, Date>();
  for (const d of out) byTime.set(d.getTime(), d);
  return Array.from(byTime.values()).sort((a, b) => a.getTime() - b.getTime());
}

function sampleEvenly(values: Date[], count: number): Date[] {
  const safeCount = Math.max(2, Math.min(values.length, count));
  const step = (values.length - 1) / (safeCount - 1);
  const out: Date[] = [];
  for (let i = 0; i < safeCount; i += 1) {
    const index = Math.round(i * step);
    const item = values[index];
    if (item) out.push(item);
  }
  return out;
}
