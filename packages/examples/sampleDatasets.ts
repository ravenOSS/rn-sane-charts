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
 */
export const sampleLineSeries: [Series, Series, Series] = [
  {
    id: "Revenue",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 20 + Math.sin(i / 5) * 6 + i * 0.1,
    })),
  },
  {
    id: "Forecast",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 19 + Math.sin((i + 3) / 6) * 5 + i * 0.12,
    })),
  },
  {
    id: "Target",
    data: Array.from({ length: POINT_COUNT }, (_, i) => ({
      x: buildDateAtOffset(i),
      y: 22 + Math.sin((i - 4) / 7) * 3 + i * 0.08,
    })),
  },
];

/**
 * Area chart fixture (single-series area + line overlay).
 */
export const sampleAreaSeries: Series = sampleLineSeries[0];

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
 */
export const sampleBarData: CategoryDatum[] = [
  { x: "Mon", y: 18 },
  { x: "Tue", y: 23 },
  { x: "Wed", y: 20 },
  { x: "Thu", y: 26 },
  { x: "Fri", y: 24 },
  { x: "Sat", y: 14 },
  { x: "Sun", y: 12 },
];

/**
 * Grouped bar fixture.
 *
 * "values" keys are series ids; each category keeps a side-by-side group.
 */
export const sampleGroupedBarData: GroupedBarDatum[] = [
  { category: "Q1", values: { Revenue: 120, Forecast: 110, Target: 115 } },
  { category: "Q2", values: { Revenue: 135, Forecast: 130, Target: 140 } },
  { category: "Q3", values: { Revenue: 128, Forecast: 134, Target: 138 } },
  { category: "Q4", values: { Revenue: 150, Forecast: 145, Target: 152 } },
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
 * Radius variation is intentionally subtle so point-size scaling can be tested.
 */
export const sampleScatterData: ScatterDatum[] = Array.from(
  { length: 64 },
  (_, i) => {
    const x = i % 16;
    const y = Math.sin(i / 4) * 8 + (i % 8) + 12;
    return {
      x,
      y: Number(y.toFixed(2)),
      r: 3 + (i % 4),
    };
  }
);

/**
 * Histogram fixture (raw values; binning done by chart/core layer).
 */
export const sampleHistogramValues: number[] = [
  12, 15, 18, 22, 19, 17, 14, 16, 21, 25, 28, 24, 20, 19, 23, 26, 27, 30, 32,
  35, 34, 31, 29, 27, 24, 22, 21, 18, 16, 14, 12, 11, 13, 15, 17, 19, 20, 22,
  24, 26, 28, 30, 31, 29, 27, 25, 23, 21, 18, 16,
];
