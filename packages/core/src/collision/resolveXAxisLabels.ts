// packages/core/src/collision/resolveXAxisLabels.ts

import type { Degrees, MeasureTextFn, FontSpec } from "../layout/measureTextTypes";

/**
 * Bounding box in pixel space for collision detection.
 *
 * Coordinate system:
 * - X increases to the right.
 * - Y increases downward.
 *
 * For x-axis labels, we care primarily about xMin/xMax overlap.
 */
export type BoundingBox = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type Tick = {
  /** Original scale value (Date, number, category). */
  value: unknown;
  /** Formatted string label to render. */
  label: string;
  /** Pixel position of the tick on the axis (center point for label). */
  x: number;
};

export type ResolveXAxisLabelsConfig = {
  /**
   * Font used for tick labels. Must match renderer to avoid clipping/collisions.
   */
  font: FontSpec;

  /**
   * Angles to try, in order.
   *
   * Default is intentionally conservative and familiar:
   * - 0° keeps labels horizontal
   * - 45° solves many collisions while preserving readability
   * - 90° is a last resort for dense categorical axes
   *
   * We keep this as a *config* (not a public prop in MVP) so we can evolve
   * behavior without breaking API.
   */
  anglesToTry?: Degrees[];

  /**
   * Minimum gap (px) required between adjacent labels to be considered non-colliding.
   * A few pixels helps avoid "touching" labels which still feels cluttered.
   */
  minLabelGapPx?: number;

  /**
   * If true, rotation is attempted before skipping ticks.
   * This generally looks better for business charts.
   */
  preferRotationOverSkipping?: boolean;

  /**
   * Hard cap on skipping to prevent pathological loops.
   * If we exceed this, we fall back to first/last tick only.
   */
  maxSkipStep?: number;
};

export type ResolvedXAxisLabels = {
  /**
   * Chosen angle that produced collision-free layout (or best-effort fallback).
   */
  angle: Degrees;

  /**
   * The final set of ticks to render (may be filtered by skipping).
   */
  ticks: Tick[];

  /**
   * Bounding boxes for the final ticks; used for:
   * - layout bottom margin calculation
   * - debugging/visual test harnesses
   */
  labelBoxes: BoundingBox[];

  /**
   * Required vertical space (px) under the plot area to render tick labels safely.
   * This is derived from measured label height AFTER rotation.
   */
  requiredBottomMarginPx: number;

  /**
   * Optional debug info for developers (can be stripped/minimized later).
   */
  debug?: {
    attemptedAngles: Degrees[];
    attemptedSkipSteps: number[];
    reason: "no-collision" | "skip-resolved" | "fallback-first-last";
  };
};

/**
 * Resolve x-axis label collisions using rotation and/or tick skipping.
 *
 * Strategy (intentionally human-friendly):
 * 1) Try rotation-only: 0°, then 45°, then 90°
 * 2) If still colliding, apply tick skipping and re-try angles
 * 3) If nothing works, fall back to showing only first+last ticks at 90°
 *
 * Why this strategy:
 * - Rotation preserves data density better than skipping for many time-series axes.
 * - 45° is a common readability compromise and often "just works".
 * - Skipping is necessary for very dense categorical axes.
 * - First/last fallback guarantees something readable in all cases.
 *
 * Future extension points:
 * - Add 60° (useful when 45° still collides but 90° is too extreme)
 * - Smarter tick selection (e.g., always include last, include month boundaries)
 * - Multi-line labels (wrapping) for categories
 */
export function resolveXAxisLabels(
  inputTicks: Tick[],
  measureText: MeasureTextFn,
  config: ResolveXAxisLabelsConfig
): ResolvedXAxisLabels {
  const anglesToTry: Degrees[] = config.anglesToTry ?? [0, 45, 90];
  const minGap = config.minLabelGapPx ?? 4;
  const preferRotation = config.preferRotationOverSkipping ?? true;
  const maxSkipStep = Math.max(2, config.maxSkipStep ?? 12);

  // Defensive: if 0 or 1 ticks, no collision logic is needed.
  if (inputTicks.length <= 1) {
    const angle = anglesToTry[0] ?? 0;
    const { boxes, bottomMargin } = measureLabelBoxes(inputTicks, angle, measureText, config.font);
    return {
      angle,
      ticks: inputTicks,
      labelBoxes: boxes,
      requiredBottomMarginPx: bottomMargin,
      debug: { attemptedAngles: anglesToTry, attemptedSkipSteps: [], reason: "no-collision" },
    };
  }

  const attemptedSkipSteps: number[] = [];

  // Helper: attempt angles on a given tick list.
  const tryAngles = (ticks: Tick[]) => {
    for (const angle of anglesToTry) {
      const { boxes, bottomMargin } = measureLabelBoxes(ticks, angle, measureText, config.font);
      if (!hasCollision(boxes, minGap)) {
        return { angle, ticks, boxes, bottomMargin, reason: "no-collision" as const };
      }
    }
    return null;
  };

  // 1) Rotation-only attempt
  if (preferRotation) {
    const result = tryAngles(inputTicks);
    if (result) {
      return {
        angle: result.angle,
        ticks: result.ticks,
        labelBoxes: result.boxes,
        requiredBottomMarginPx: result.bottomMargin,
        debug: { attemptedAngles: anglesToTry, attemptedSkipSteps, reason: result.reason },
      };
    }
  }

  // 2) Skipping + rotation attempts
  for (let step = 2; step <= maxSkipStep; step++) {
    attemptedSkipSteps.push(step);
    const skipped = skipEvery(inputTicks, step);

    // If skipping collapses to <2 labels, there's nothing meaningful to collide.
    if (skipped.length < 2) break;

    const result = tryAngles(skipped);
    if (result) {
      return {
        angle: result.angle,
        ticks: result.ticks,
        labelBoxes: result.boxes,
        requiredBottomMarginPx: result.bottomMargin,
        debug: { attemptedAngles: anglesToTry, attemptedSkipSteps, reason: "skip-resolved" },
      };
    }
  }

  // 3) Fallback: first + last only, rotated 90° (or last angle in list).
  // Rationale: guarantees legibility and avoids total axis failure.
  const fallbackAngle = anglesToTry.includes(90) ? 90 : (anglesToTry[anglesToTry.length - 1] ?? 90);
  // Safe due to earlier `inputTicks.length > 1` guard.
  const fallbackTicks = [inputTicks[0]!, inputTicks[inputTicks.length - 1]!];
  const { boxes, bottomMargin } = measureLabelBoxes(fallbackTicks, fallbackAngle, measureText, config.font);

  return {
    angle: fallbackAngle,
    ticks: fallbackTicks,
    labelBoxes: boxes,
    requiredBottomMarginPx: bottomMargin,
    debug: { attemptedAngles: anglesToTry, attemptedSkipSteps, reason: "fallback-first-last" },
  };
}

/**
 * Measure label boxes for collision detection.
 *
 * Important:
 * - We treat the tick's `x` as the *center* of the label by default.
 * - Renderers can choose different anchoring later, but collision detection needs
 *   a consistent assumption.
 */
function measureLabelBoxes(
  ticks: Tick[],
  angle: Degrees,
  measureText: MeasureTextFn,
  font: FontSpec
): { boxes: BoundingBox[]; bottomMargin: number } {
  const measured = ticks.map((t) => {
    const m = measureText({ text: t.label, font, angle });

    /**
     * Anchor policy:
     * - 0° labels are centered on tick.x (standard horizontal axis labeling).
     * - Rotated labels anchor their near-axis edge at tick.x and extend rightward.
     *
     * Why:
     * - Produces a stable imaginary offset line from the axis (non-jagged look).
     * - Better matches common 45°/90° business chart conventions.
     * - Allows 45° to pass collision checks in situations where center anchoring
     *   would force an unnecessary jump to 90°.
     */
    const isHorizontal = Math.abs(angle) < 0.001;
    const xMin = isHorizontal ? t.x - m.width / 2 : t.x;
    const xMax = isHorizontal ? t.x + m.width / 2 : t.x + m.width;

    // For x-axis labels we typically place text below axis line; y bounds are relative.
    // The layout engine uses height to allocate bottom margin.
    const yMin = 0;
    const yMax = m.height;

    return { xMin, xMax, yMin, yMax } satisfies BoundingBox;
  });

  const bottomMargin = measured.reduce((max, b) => Math.max(max, b.yMax - b.yMin), 0);

  return { boxes: measured, bottomMargin };
}

/**
 * Collision detection: adjacent overlap check.
 *
 * Why adjacent-only:
 * - Tick boxes are ordered by x.
 * - If adjacent boxes don't overlap, non-adjacent won't overlap either.
 * - This is O(n) and fast enough for typical tick counts.
 */
function hasCollision(boxes: BoundingBox[], minGapPx: number): boolean {
  for (let i = 1; i < boxes.length; i++) {
    const prev = boxes[i - 1];
    const cur = boxes[i];
    if (!prev || !cur) continue;
    if (cur.xMin < prev.xMax + minGapPx) {
      return true;
    }
  }
  return false;
}

/**
 * Skip every Nth tick.
 *
 * Note:
 * - This is a simple strategy that preserves order.
 * - Future improvement: keep "important" ticks (e.g., month boundaries) while
 *   skipping others.
 */
function skipEvery<T>(items: T[], step: number): T[] {
  return items.filter((_, i) => i % step === 0);
}
