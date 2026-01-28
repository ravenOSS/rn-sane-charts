// packages/core/src/layout/measureTextTypes.ts

/**
 * Text measurement contract for rn-sane-charts.
 *
 * Why this exists:
 * - The core package must remain UI-framework agnostic (no Skia, no React).
 * - Layout decisions depend on *measured* text bounds (axis labels, ticks, titles).
 * - Different renderers (Skia RN, future Canvas web, etc.) measure text differently.
 *
 * This file defines a minimal "adapter" interface:
 * - The renderer supplies a `measureText` function.
 * - Core uses it to calculate layout and collision-free axis label placement.
 *
 * IMPORTANT:
 * - The measurement must reflect the actual font settings used by the renderer.
 * - The returned width/height MUST represent the axis-aligned bounding box (AABB)
 *   for the rendered text after rotation.
 *
 * Extension point:
 * - If we later support advanced typography (fontWeight, letterSpacing),
 *   those can be added to `FontSpec` without changing core algorithms.
 */

export type Degrees = 0 | 45 | 90 | number;

export type FontSpec = {
  /** Font family name used by the renderer (e.g., "Inter"). */
  family?: string;
  /** Font size in px. */
  size: number;
  /** Optional font weight. */
  weight?: "normal" | "medium" | "semibold" | "bold" | number;
  /** Optional font style. */
  style?: "normal" | "italic";
};

export type TextMeasureInput = {
  text: string;
  font: FontSpec;

  /**
   * Rotation angle in degrees.
   * Convention:
   * - Positive angles rotate clockwise for screen coordinate systems.
   * - The renderer implementation can choose sign convention internally,
   *   but the returned bounds must match on-screen result.
   */
  angle?: Degrees;
};

export type TextMeasureResult = {
  /**
   * Axis-aligned bounding box dimensions AFTER rotation.
   * This is what collision detection uses.
   */
  width: number;
  height: number;

  /**
   * Optional baseline metrics. Not required for MVP, but useful for precise
   * vertical alignment and future web parity.
   */
  ascent?: number;
  descent?: number;
};

export type MeasureTextFn = (input: TextMeasureInput) => TextMeasureResult;