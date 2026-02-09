import type { MeasureTextFn } from "@rn-sane-charts/core";
import type { SaneChartFonts, SaneChartTheme } from "@rn-sane-charts/rn";

/**
 * Example-level static chart theme.
 *
 * This models the "one-time setup" pattern:
 * - Keep stable brand/style tokens in one file.
 * - Reuse across every chart in the app.
 */
export const exampleChartTheme: Partial<SaneChartTheme> = {
  series: {
    palette: ["#2563EB", "#DC2626", "#16A34A"],
    strokeWidth: 2,
  },
};

/**
 * Keep series colors centralized so multi-line charts stay consistent.
 */
export const exampleSeriesColors = {
  revenue: "#2563EB",
  forecast: "#DC2626",
  target: "#16A34A",
} as const;

/**
 * Color-blind-friendly palette (Okabe-Ito inspired) used by the accessibility
 * verification view.
 */
export const accessibilityPalette = ["#0072B2", "#D55E00", "#009E73"] as const;

/**
 * Build a high-contrast accessibility check theme for the current color scheme.
 *
 * Why this exists:
 * - Demonstrates a "known-good" token set for chart readability checks.
 * - Keeps accessibility tuning centralized instead of scattering constants.
 */
export function createAccessibilityTheme(
  colorScheme: "light" | "dark"
): Partial<SaneChartTheme> {
  if (colorScheme === "dark") {
    return {
      background: "#0B1220",
      axis: {
        tick: { color: "#F8FAFC" },
        line: { stroke: "#94A3B8", strokeWidth: 1.15 },
      },
      grid: { stroke: "rgba(148,163,184,0.36)", strokeWidth: 1 },
      series: {
        palette: ["#56B4E9", "#E69F00", "#009E73"],
        strokeWidth: 2.4,
      },
    };
  }

  return {
    background: "#FFFFFF",
    axis: {
      tick: { color: "#111827" },
      line: { stroke: "#4B5563", strokeWidth: 1.1 },
    },
    grid: { stroke: "rgba(75,85,99,0.24)", strokeWidth: 1 },
    series: {
      palette: [...accessibilityPalette],
      strokeWidth: 2.2,
    },
  };
}

/**
 * Visual presets by chart type.
 *
 * These presets are app-level configuration targets. Implemented renderers
 * (line/area) can use them now, while planned renderers should align to these
 * keys to keep visual behavior consistent.
 */
export const exampleChartTypeConfig = {
  line: {
    strokeWidth: 2,
    colors: [exampleSeriesColors.revenue, exampleSeriesColors.forecast, exampleSeriesColors.target],
  },
  area: {
    fillOpacity: 0.18,
    strokeWidth: 2,
    colors: [exampleSeriesColors.revenue, exampleSeriesColors.forecast, exampleSeriesColors.target],
    baselineY: 0,
  },
  bar: {
    barRadius: 2,
    barGapPx: 6,
    color: "#2563EB",
  },
  groupedBar: {
    barRadius: 2,
    groupGapPx: 10,
    colors: [exampleSeriesColors.revenue, exampleSeriesColors.forecast, exampleSeriesColors.target],
  },
  stackedBar: {
    barRadius: 2,
    colors: ["#2563EB", "#16A34A", "#EA580C"],
  },
  scatter: {
    pointRadius: 4,
    color: "#2563EB",
    selectedPointRadius: 6,
  },
  histogram: {
    bins: 12,
    color: "#2563EB",
    barGapPx: 2,
  },
} as const;

/**
 * Build chart fonts from a shared family token + renderer measure function.
 *
 * Dynamic input:
 * - `fontFamily` can vary by platform.
 * - `measureText` is renderer-bound runtime state.
 *
 * Static policy:
 * - Font sizes/weights are fixed here for app-wide consistency.
 */
export function createExampleChartFonts(input: {
  fontFamily: string;
  measureText: MeasureTextFn;
}): SaneChartFonts {
  return {
    measureText: input.measureText,
    xTickFont: { size: 12, family: input.fontFamily },
    yTickFont: { size: 12, family: input.fontFamily },
    titleFont: { size: 16, family: input.fontFamily, weight: "semibold" },
    subtitleFont: { size: 12, family: input.fontFamily },
    xAxisTitleFont: { size: 12, family: input.fontFamily, weight: "medium" },
    yAxisTitleFont: { size: 12, family: input.fontFamily, weight: "medium" },
  };
}
