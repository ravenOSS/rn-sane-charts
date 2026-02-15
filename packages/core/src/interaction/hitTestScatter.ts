/**
 * Find the nearest numeric value in a sorted or unsorted array.
 *
 * Why this helper exists:
 * - Gesture interaction often needs nearest x-slot snapping.
 * - Keeping it pure allows consistent snapping behavior across renderers.
 */
export function findNearestNumericValue(
  values: readonly number[],
  target: number
): number {
  if (values.length === 0) return Number.NaN;
  let best = values[0] ?? Number.NaN;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const value of values) {
    const distance = Math.abs(value - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = value;
    }
  }
  return best;
}
