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
  axis: {
    tick: { color: "rgba(0,0,0,0.78)" },
    line: { stroke: "rgba(0,0,0,0.30)", strokeWidth: 1 },
  },
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
