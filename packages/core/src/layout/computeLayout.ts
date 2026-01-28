import type { ChartPadding, Tick, YTick } from "../model/types";
import { resolveXAxisLabels } from "../collision/resolveXAxisLabels";
import type { MeasureTextFn } from "./measureTextTypes";
import type { AxisSpec, ChartTextSpec, LayoutResult, Rect } from "./layoutTypes";

export type { AxisSpec, ChartTextSpec, LayoutResult, Rect } from "./layoutTypes";

export type LayoutInput = {
  width: number;
  height: number;

  padding?: ChartPadding;

  text: ChartTextSpec;

  xAxis: AxisSpec;
  yAxis: AxisSpec;

  /**
   * Renderer-provided text measurement function.
   *
   * Contract: returns AABB width/height AFTER rotation.
   */
  measureText: MeasureTextFn;

  /** Precomputed ticks with pixel positions. */
  xTicks: Tick[];
  yTicks: YTick[];
};

export type LayoutOutput = LayoutResult & {
  /**
   * Full x-axis label resolution result.
   *
   * Core returns this so the renderer can follow the same decisions (angle + skipping),
   * and so subsequent planning passes can reuse the computed tick list.
   */
  resolvedXAxis: {
    angle: number;
    ticks: Tick[];
    requiredBottomMarginPx: number;
  };
};

/**
 * Compute chart layout rectangles (header / plot / axes) and x-axis label decisions.
 *
 * Design goals:
 * - Deterministic: depends only on inputs (ticks are already in pixel space)
 * - Conservative: avoids clipped labels by budgeting margins from measured text
 * - Minimal: enough for MVP charts; can be refined iteratively
 *
 * Strategy (MVP):
 * - Measure header height from title/subtitle
 * - Measure y-axis width from the widest y tick label
 * - Resolve x-axis collisions (angle + skipping) to derive required bottom margin
 * - Allocate plot rect from remaining space, respecting padding
 */
export function computeLayout(input: LayoutInput): LayoutOutput {
  const pad = normalizePadding(input.padding);

  const bounds: Rect = { x: 0, y: 0, width: input.width, height: input.height };

  const headerHeight = measureHeaderHeight(input.measureText, input.text);
  const header: Rect = {
    x: pad.left,
    y: pad.top,
    width: Math.max(0, input.width - pad.left - pad.right),
    height: headerHeight,
  };

  const yAxisWidth = input.yAxis.show === false ? 0 : measureYAxisWidth(input.measureText, input.yAxis, input.yTicks);

  const resolvedXAxis =
    input.xAxis.show === false
      ? { angle: 0, ticks: input.xTicks, requiredBottomMarginPx: 0 }
      : resolveXAxisLabels(input.xTicks, input.measureText, {
          font: input.xAxis.tickFont,
          anglesToTry: input.xAxis.xLabelAnglesToTry,
          minLabelGapPx: input.xAxis.minTickLabelGapPx,
        });

  // Axis baseline/padding: leave a bit of vertical room even for short labels.
  const xAxisHeight = input.xAxis.show === false ? 0 : Math.ceil(resolvedXAxis.requiredBottomMarginPx + 12);

  const plotX = pad.left + yAxisWidth;
  const plotY = pad.top + headerHeight;
  const plotWidth = Math.max(0, input.width - pad.left - pad.right - yAxisWidth);
  const plotHeight = Math.max(0, input.height - plotY - pad.bottom - xAxisHeight);

  const plot: Rect = { x: plotX, y: plotY, width: plotWidth, height: plotHeight };

  const yAxis: Rect = {
    x: pad.left,
    y: plotY,
    width: yAxisWidth,
    height: plotHeight,
  };

  const xAxis: Rect = {
    x: plotX,
    y: plotY + plotHeight,
    width: plotWidth,
    height: xAxisHeight,
  };

  return {
    bounds,
    header,
    plot,
    xAxis,
    yAxis,
    decisions: {
      xAxis: {
        labelAngle: resolvedXAxis.angle,
        ticks: resolvedXAxis.ticks,
      },
    },
    padding: pad,
    resolvedXAxis: {
      angle: resolvedXAxis.angle,
      ticks: resolvedXAxis.ticks,
      requiredBottomMarginPx: resolvedXAxis.requiredBottomMarginPx,
    },
  };
}

function normalizePadding(p?: ChartPadding): { top: number; right: number; bottom: number; left: number } {
  // Opinionated default: modest breathing room, fits most mobile charts.
  const d = 12;
  return {
    top: p?.top ?? d,
    right: p?.right ?? d,
    bottom: p?.bottom ?? d,
    left: p?.left ?? d,
  };
}

function measureHeaderHeight(measureText: MeasureTextFn, text: ChartTextSpec): number {
  // Title/subtitle are optional; fonts are required for deterministic measurement.
  const titleH = text.title ? measureText({ text: text.title, font: text.titleFont, angle: 0 }).height : 0;
  const subtitleH = text.subtitle
    ? measureText({ text: text.subtitle, font: text.subtitleFont, angle: 0 }).height
    : 0;

  // Small spacing between title and subtitle when both exist.
  const gap = text.title && text.subtitle ? 4 : 0;
  return Math.ceil(titleH + gap + subtitleH);
}

function measureYAxisWidth(measureText: MeasureTextFn, yAxis: AxisSpec, yTicks: YTick[]): number {
  if (yTicks.length === 0) return 0;

  let maxW = 0;
  for (const t of yTicks) {
    const w = measureText({ text: t.label, font: yAxis.tickFont, angle: 0 }).width;
    if (w > maxW) maxW = w;
  }

  // Leave room for a small tick mark + gap between labels and plot.
  return Math.ceil(maxW + 10);
}
