export type XYPoint = {
  x: number;
  y: number;
};

/**
 * Screen-space point with an interaction hit radius (px).
 *
 * Used by RN scrubbing so touch targets can exceed drawn marker size without
 * changing geometry — aligns with mobile touch-target guidance.
 */
export type PointWithHitRadius = XYPoint & { hitRadiusPx: number };

/**
 * Accepts a geometric nearest-neighbor candidate only if the query lies within
 * that point's hit radius.
 *
 * Why this exists:
 * - Nearest-point search returns the closest mark even when the finger is far
 *   away; callers need an explicit radius gate for usable touch targets.
 * - Keeping the check pure lets spatial-index and linear fallbacks share one rule.
 */
export function applyInteractiveHitRadius<T extends PointWithHitRadius>(
  point: T | null,
  x: number,
  y: number
): T | null {
  if (!point) return null;
  const dx = point.x - x;
  const dy = point.y - y;
  const r = point.hitRadiusPx;
  if (!Number.isFinite(r) || r < 0) return null;
  if (dx * dx + dy * dy > r * r) return null;
  return point;
}

/**
 * Nearest-neighbor hit test in 2D screen space.
 *
 * Why this helper lives in core:
 * - It is pure geometry math with no renderer dependencies.
 * - Keeping this in core makes interaction behavior deterministic and testable.
 */
export function findNearestPoint<T extends XYPoint>(
  points: readonly T[],
  x: number,
  y: number
): T | null {
  let best: T | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const point of points) {
    const dx = point.x - x;
    const dy = point.y - y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < bestDistance) {
      bestDistance = distanceSq;
      best = point;
    }
  }
  return best;
}

/**
 * Collect points aligned to a shared x-anchor.
 *
 * Use case:
 * - "index" interaction mode groups all series at the nearest x-slot.
 */
export function collectPointsAtAnchorX<T extends XYPoint>(
  points: readonly T[],
  anchorX: number,
  tolerancePx = 0.5
): T[] {
  const out: T[] = [];
  for (const point of points) {
    if (Math.abs(point.x - anchorX) < tolerancePx) out.push(point);
  }
  return out;
}
