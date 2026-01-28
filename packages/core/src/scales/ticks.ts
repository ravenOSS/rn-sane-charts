// packages/core/src/scales/ticks.ts

import type { Degrees } from "../layout/measureTextTypes";

/**
 * Tick helpers.
 *
 * MVP intentionally keeps ticks simple:
 * - caller provides formatted labels
 * - layout resolves collisions
 *
 * Future extension:
 * - "smart tick selection" strategies (time boundaries, round numbers)
 */

export type TickLabelAnchor = "start" | "middle" | "end";

/**
 * Recommended anchor based on label rotation angle.
 *
 * Why:
 * - At 0°, centered labels are standard and easiest to scan.
 * - At 45°, starting anchor reduces overlap near the tick mark in many UIs.
 * - At 90°, ending anchor keeps labels from drifting too far right.
 *
 * This is not a public API in MVP; it's guidance for the renderer.
 */
export function recommendedXAxisAnchor(angle: Degrees): TickLabelAnchor {
  if (angle === 0) return "middle";
  if (angle === 90) return "end";
  return "start";
}