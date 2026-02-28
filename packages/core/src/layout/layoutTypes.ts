import type { Degrees, FontSpec } from "./measureTextTypes";
import type { Tick } from "../model/types";

/**
 * Basic rectangle type used throughout layout and rendering.
 *
 * Convention:
 * - `x`,`y` describe the top-left corner
 * - `width`,`height` are non-negative
 */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Axis configuration for MVP layout.
 *
 * Notes:
 * - This is a *core-internal* type; the RN package can expose friendlier props.
 * - Keep it conservative to avoid configuration sprawl.
 */
export type AxisSpec = {
  show?: boolean;

  /** Optional axis title text (rendered by the RN layer). */
  title?: string;

  /**
   * Tick label font. This must match renderer measurement.
   * If fonts diverge, collision detection and margins will be wrong.
   */
  tickFont: FontSpec;

  /** Axis title font (optional for MVP). */
  titleFont?: FontSpec;

  /**
   * Angles to try for x-axis label collision resolution.
   * Default handled by collision resolver; this is an override hook.
   */
  xLabelAnglesToTry?: Degrees[];

  /** Minimum gap between adjacent tick labels (px). */
  minTickLabelGapPx?: number;
};

/**
 * Top-level chart header text.
 */
export type ChartTextSpec = {
  title?: string;
  subtitle?: string;
  storyNote?: string;
  titleFont: FontSpec;
  subtitleFont: FontSpec;
  storyNoteFont?: FontSpec;
};

/**
 * A small bundle of "computed decisions" that the renderer should follow.
 *
 * For example:
 * - x-axis label rotation
 * - tick skipping decisions
 */
export type LayoutDecisions = {
  xAxis: {
    labelAngle: Degrees;
    ticks: Tick[];
  };
};

/**
 * Result of layout computation.
 * The RN layer uses these rectangles to place and clip drawing.
 */
export type LayoutResult = {
  bounds: Rect;
  header: Rect;
  plot: Rect;
  xAxis: Rect;
  yAxis: Rect;

  decisions: LayoutDecisions;

  /** Debug-friendly: actual padding used after defaulting. */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};
