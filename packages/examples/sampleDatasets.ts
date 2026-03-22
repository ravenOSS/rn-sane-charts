import type { Series } from "@rn-sane-charts/core";

/**
 * Sample datasets used to exercise current and planned chart types.
 *
 * Why keep this centralized:
 * - Makes visual QA reproducible across chart implementations.
 * - Gives future chart renderers (bar/scatter/histogram) ready-to-use fixtures.
 * - Keeps `App.tsx` focused on rendering orchestration instead of data creation.
 */

export type CategoryDatum = {
  x: string | number;
  y: number;
};

export type GroupedBarDatum = {
  category: string;
  values: Record<string, number>;
};

export type StackedBarDatum = {
  category: string;
  values: Record<string, number>;
};

export type ScatterDatum = {
  x: number;
  y: number;
  r?: number;
};

const START_DATE = new Date(2026, 0, 1);
const POINT_COUNT = 50;

function buildDateAtOffset(days: number): Date {
  return new Date(
    START_DATE.getFullYear(),
    START_DATE.getMonth(),
    START_DATE.getDate() + days
  );
}

/**
 * Line chart fixture (multi-series time-series).
 *
 * Series are generic regional trends for gallery demos — not FP&A actuals/forecasts.
 */
export const sampleLineSeries: [Series, Series, Series] = [
  {
    id: "East",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 20 + Math.sin(i / 5) * 6 + i * 0.1,
    })),
  },
  {
    id: "Central",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 19 + Math.sin((i + 3) / 6) * 5 + i * 0.12,
    })),
  },
  {
    id: "West",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 22 + Math.sin((i - 4) / 7) * 3 + i * 0.08,
    })),
  },
];

/**
 * Area chart fixture (single-series area + line overlay).
 */
export const sampleAreaSeries: Series = {
  id: "Active Users",
  data: Array.from({ length: POINT_COUNT }, (_, i) => ({
    x: buildDateAtOffset(i),
    y: 680 + Math.sin(i / 7) * 90 + i * 2.2,
  })),
};

/**
 * Stacked area fixture (future renderer target).
 *
 * Each series represents one stack layer over shared x values.
 */
export const sampleStackedAreaSeries: Series[] = [
  {
    id: "Organic",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 8 + Math.sin(i / 6) * 1.6 + i * 0.03,
    })),
  },
  {
    id: "Paid",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 5 + Math.sin((i + 2) / 7) * 1.2 + i * 0.025,
    })),
  },
  {
    id: "Partner",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 3 + Math.sin((i - 3) / 8) * 0.9 + i * 0.02,
    })),
  },
];

/**
 * Simple bar fixture (single-series categorical bars).
 *
 * Metric choice: net cash flow can legitimately cross zero, so this
 * fixture is useful for validating baseline behavior for positive/negative bars.
 */
export const sampleBarData: CategoryDatum[] = [
  { x: "Mon", y: 12 },
  { x: "Tue", y: -4 },
  { x: "Wed", y: 8 },
  { x: "Thu", y: -2 },
  { x: "Fri", y: 15 },
  { x: "Sat", y: -6 },
  { x: "Sun", y: 5 },
];

/**
 * Grouped bar fixture.
 *
 * "values" keys are series ids; each category keeps a side-by-side group.
 */
export const sampleGroupedBarData: GroupedBarDatum[] = [
  { category: "Q1", values: { East: 120, Central: 110, West: 115 } },
  { category: "Q2", values: { East: 135, Central: 130, West: 140 } },
  { category: "Q3", values: { East: 128, Central: 134, West: 138 } },
  { category: "Q4", values: { East: 150, Central: 145, West: 152 } },
];

/**
 * Stacked bar fixture.
 *
 * "values" keys are stack segments for each category.
 */
export const sampleStackedBarData: StackedBarDatum[] = [
  { category: "North", values: { Hardware: 42, Software: 35, Services: 18 } },
  { category: "South", values: { Hardware: 36, Software: 31, Services: 22 } },
  { category: "East", values: { Hardware: 39, Software: 29, Services: 20 } },
  { category: "West", values: { Hardware: 33, Software: 27, Services: 24 } },
];

/**
 * Scatter fixture.
 *
 * `x` is sample index (0..63); `y` is a synthetic measurement. Radius variation
 * is intentionally subtle for glyph-size exercises.
 */
export const sampleScatterData: ScatterDatum[] = Array.from(
  { length: 64 },
  (_, i) => {
    const y = Math.sin(i / 4) * 8 + (i % 8) + 12;
    return {
      x: i,
      y: Number(y.toFixed(2)),
      r: 3 + (i % 4),
    };
  }
);

/** Length of the linked-metrics demo (shared x domain for two charts). */
const LINKED_METRIC_DAYS = 42;

/**
 * Paired daily metrics for **linked chart** demos (separate y-axes, same dates).
 *
 * Use with `LinkedChartPair`: match `xTickValues` / `xTickDomainMode` on both charts.
 * Revenue is synthetic currency units; margin is synthetic percent (0–100 scale).
 */
export const sampleLinkedRevenueSeries: Series = {
  id: 'Revenue',
  data: Array.from({ length: LINKED_METRIC_DAYS }, (_, i) => ({
    x: buildDateAtOffset(i),
    y: 52 + Math.sin(i / 5) * 8 + i * 0.35,
  })),
};

export const sampleLinkedMarginSeries: Series = {
  id: 'Gross margin',
  data: Array.from({ length: LINKED_METRIC_DAYS }, (_, i) => ({
    x: buildDateAtOffset(i),
    y: 32 + Math.sin(i / 7) * 3 + (i % 6) * 0.12,
  })),
};

/**
 * Histogram fixture (raw values; binning done by chart/core layer).
 */
export const sampleHistogramValues: number[] = [
  12, 15, 18, 22, 19, 17, 14, 16, 21, 25, 28, 24, 20, 19, 23, 26, 27, 30, 32,
  35, 34, 31, 29, 27, 24, 22, 21, 18, 16, 14, 12, 11, 13, 15, 17, 19, 20, 22,
  24, 26, 28, 30, 31, 29, 27, 25, 23, 21, 18, 16,
];
