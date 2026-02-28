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

  const yAxisWidth =
    input.yAxis.show === false
      ? 0
      : measureYAxisWidth(input.measureText, input.yAxis, input.yTicks);
  const plotWidthForHeader = Math.max(
    0,
    input.width - pad.left - pad.right - yAxisWidth
  );
  const headerHeight = measureHeaderHeight(
    input.measureText,
    input.text,
    plotWidthForHeader
  );
  const header: Rect = {
    x: pad.left,
    y: pad.top,
    width: Math.max(0, input.width - pad.left - pad.right),
    height: headerHeight,
  };

  const resolvedXAxis =
    input.xAxis.show === false
      ? { angle: 0, ticks: input.xTicks, requiredBottomMarginPx: 0 }
      : resolveXAxisLabels(input.xTicks, input.measureText, {
          font: input.xAxis.tickFont,
          anglesToTry: input.xAxis.xLabelAnglesToTry,
          minLabelGapPx: input.xAxis.minTickLabelGapPx,
        });

  // Axis baseline/padding: leave room for ticks/labels and optional axis title.
  const xAxisHeight =
    input.xAxis.show === false
      ? 0
      : Math.ceil(
          resolvedXAxis.requiredBottomMarginPx +
            12 +
            measureXAxisTitleHeight(input.measureText, input.xAxis)
        );

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

function measureHeaderHeight(
  measureText: MeasureTextFn,
  text: ChartTextSpec,
  maxWidth: number
): number {
  // Title/subtitle are optional; fonts are required for deterministic measurement.
  const titleH = text.title
    ? measureText({ text: text.title, font: text.titleFont, angle: 0 }).height
    : 0;
  const subtitleH = text.subtitle
    ? measureText({ text: text.subtitle, font: text.subtitleFont, angle: 0 }).height
    : 0;
  const storyFont = text.storyNoteFont ?? text.subtitleFont;
  const storyLines =
    text.storyNote && text.storyNote.trim().length > 0
      ? wrapTextLines({
          text: text.storyNote,
          font: storyFont,
          maxWidth,
          measureText,
        })
      : [];
  const storyLineGap = storyLines.length > 1 ? 2 : 0;
  const storyH = storyLines.reduce((sum, line, index) => {
    const measured = measureText({
      text: line,
      font: storyFont,
      angle: 0,
    });
    return sum + measured.height + (index > 0 ? storyLineGap : 0);
  }, 0);

  // Small spacing between title and subtitle when both exist.
  const gap = text.title && text.subtitle ? 4 : 0;
  const storyGap =
    storyH > 0 && (titleH > 0 || subtitleH > 0) ? 4 : 0;

  /**
   * Keep a dedicated header-to-plot gap so subtitles never feel "glued" to
   * the first data marks. This improves readability across dense chart types
   * (especially stacked/grouped bars where top bars sit close to the header).
   */
  const headerBottomGap = titleH > 0 || subtitleH > 0 ? 8 : 0;

  return Math.ceil(titleH + gap + subtitleH + storyGap + storyH + headerBottomGap);
}

/**
 * Greedy word-wrap tuned for short chart annotation copy.
 *
 * Why this helper exists:
 * - Story notes must stay readable without ellipsis.
 * - Layout needs deterministic line count to reserve header height.
 */
function wrapTextLines(input: {
  text: string;
  font: AxisSpec["tickFont"];
  maxWidth: number;
  measureText: MeasureTextFn;
}): string[] {
  const normalized = input.text.trim().replace(/\s+/g, " ");
  if (!normalized) return [];

  if (input.maxWidth <= 0) return [normalized];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = input.measureText({
      text: candidate,
      font: input.font,
      angle: 0,
    }).width;
    if (width <= input.maxWidth || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function measureYAxisWidth(measureText: MeasureTextFn, yAxis: AxisSpec, yTicks: YTick[]): number {
  if (yTicks.length === 0) return measureYAxisTitleWidth(measureText, yAxis);

  let maxW = 0;
  for (const t of yTicks) {
    const w = measureText({ text: t.label, font: yAxis.tickFont, angle: 0 }).width;
    if (w > maxW) maxW = w;
  }

  /**
   * Width budget = optional y-axis title band + tick label band.
   *
   * Human reasoning:
   * - y-axis title is typically vertical; we reserve its rotated AABB width.
   * - keep a small visual gap between title and tick labels so they don't merge.
   */
  const titleBand = measureYAxisTitleWidth(measureText, yAxis);
  const titleGap = titleBand > 0 ? 8 : 0;

  // Tick label band includes room for a small tick mark + gap next to the plot.
  const tickBand = maxW + 10;
  return Math.ceil(titleBand + titleGap + tickBand);
}

/**
 * Reserve vertical space for an optional x-axis title.
 *
 * We add a small separation gap so title and rotated tick labels stay distinct.
 */
function measureXAxisTitleHeight(measureText: MeasureTextFn, xAxis: AxisSpec): number {
  if (!xAxis.title) return 0;
  const font = xAxis.titleFont ?? xAxis.tickFont;
  const m = measureText({ text: xAxis.title, font, angle: 0 });
  return Math.ceil(m.height + 6);
}

/**
 * Reserve horizontal space for an optional y-axis title.
 *
 * We measure with a 90deg rotation because the renderer draws this title
 * vertically in MVP.
 */
function measureYAxisTitleWidth(measureText: MeasureTextFn, yAxis: AxisSpec): number {
  if (!yAxis.title) return 0;
  const font = yAxis.titleFont ?? yAxis.tickFont;
  const m = measureText({ text: yAxis.title, font, angle: 90 });
  return Math.ceil(m.width);
}
