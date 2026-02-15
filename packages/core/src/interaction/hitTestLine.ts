export type XYPoint = {
  x: number;
  y: number;
};

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
