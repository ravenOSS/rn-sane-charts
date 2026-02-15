import type { XYPoint } from "./hitTestLine";

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

export type ScatterSpatialIndex<T extends XYPoint> = {
  cellSizePx: number;
  buckets: Map<string, T[]>;
  minCellX: number;
  maxCellX: number;
  minCellY: number;
  maxCellY: number;
};

/**
 * Build a deterministic spatial hash for 2D points.
 *
 * Why this helper exists:
 * - Scatter interactions are nearest-neighbor queries on every gesture move.
 * - A cell index keeps lookup local to nearby buckets instead of scanning all
 *   points, which stabilizes interaction cost for larger datasets.
 *
 * Invariants:
 * - Input order is preserved inside each bucket.
 * - Non-finite points are skipped.
 * - `cellSizePx` is clamped to a safe positive default.
 */
export function buildScatterSpatialIndex<T extends XYPoint>(
  points: readonly T[],
  cellSizePx = 44
): ScatterSpatialIndex<T> {
  const safeCellSize = clampPositive(cellSizePx, 44);
  const buckets = new Map<string, T[]>();
  let minCellX = Number.POSITIVE_INFINITY;
  let maxCellX = Number.NEGATIVE_INFINITY;
  let minCellY = Number.POSITIVE_INFINITY;
  let maxCellY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    const cellX = Math.floor(point.x / safeCellSize);
    const cellY = Math.floor(point.y / safeCellSize);
    const key = cellKey(cellX, cellY);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(point);
    else buckets.set(key, [point]);

    if (cellX < minCellX) minCellX = cellX;
    if (cellX > maxCellX) maxCellX = cellX;
    if (cellY < minCellY) minCellY = cellY;
    if (cellY > maxCellY) maxCellY = cellY;
  }

  if (buckets.size === 0) {
    minCellX = 0;
    maxCellX = -1;
    minCellY = 0;
    maxCellY = -1;
  }

  return {
    cellSizePx: safeCellSize,
    buckets,
    minCellX,
    maxCellX,
    minCellY,
    maxCellY,
  };
}

/**
 * Query nearest point via scatter spatial index.
 *
 * Search strategy:
 * 1. Expand cell rings around query cell.
 * 2. Track best point distance found so far.
 * 3. Stop when the theoretical nearest point outside scanned rings cannot beat
 *    the current best distance.
 *
 * This yields exact nearest-neighbor results while avoiding full-array scans.
 */
export function findNearestPointInScatterIndex<T extends XYPoint>(
  index: ScatterSpatialIndex<T>,
  x: number,
  y: number
): T | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (index.buckets.size === 0) return null;

  const centerCellX = Math.floor(x / index.cellSizePx);
  const centerCellY = Math.floor(y / index.cellSizePx);
  const maxRing = maxSearchRing(index, centerCellX, centerCellY);
  let best: T | null = null;
  let bestDistanceSq = Number.POSITIVE_INFINITY;

  for (let ring = 0; ring <= maxRing; ring += 1) {
    forEachRingCell(centerCellX, centerCellY, ring, (cellX, cellY) => {
      const bucket = index.buckets.get(cellKey(cellX, cellY));
      if (!bucket) return;
      for (const point of bucket) {
        const dx = point.x - x;
        const dy = point.y - y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < bestDistanceSq) {
          bestDistanceSq = distanceSq;
          best = point;
        }
      }
    });

    if (!best) continue;
    if (bestDistanceSq <= minDistanceSqOutsideRing(index.cellSizePx, x, y, centerCellX, centerCellY, ring)) {
      break;
    }
  }

  return best;
}

function forEachRingCell(
  centerCellX: number,
  centerCellY: number,
  ring: number,
  visit: (cellX: number, cellY: number) => void
): void {
  if (ring === 0) {
    visit(centerCellX, centerCellY);
    return;
  }

  const minX = centerCellX - ring;
  const maxX = centerCellX + ring;
  const minY = centerCellY - ring;
  const maxY = centerCellY + ring;

  for (let cellX = minX; cellX <= maxX; cellX += 1) {
    visit(cellX, minY);
    visit(cellX, maxY);
  }
  for (let cellY = minY + 1; cellY <= maxY - 1; cellY += 1) {
    visit(minX, cellY);
    visit(maxX, cellY);
  }
}

function minDistanceSqOutsideRing(
  cellSizePx: number,
  x: number,
  y: number,
  centerCellX: number,
  centerCellY: number,
  ring: number
): number {
  const minBoundX = (centerCellX - ring) * cellSizePx;
  const maxBoundX = (centerCellX + ring + 1) * cellSizePx;
  const minBoundY = (centerCellY - ring) * cellSizePx;
  const maxBoundY = (centerCellY + ring + 1) * cellSizePx;

  const distanceToBoundary = Math.min(
    Math.abs(x - minBoundX),
    Math.abs(maxBoundX - x),
    Math.abs(y - minBoundY),
    Math.abs(maxBoundY - y)
  );

  return distanceToBoundary * distanceToBoundary;
}

function maxSearchRing<T extends XYPoint>(
  index: ScatterSpatialIndex<T>,
  centerCellX: number,
  centerCellY: number
): number {
  if (index.buckets.size === 0) return 0;
  return Math.max(
    Math.abs(index.minCellX - centerCellX),
    Math.abs(index.maxCellX - centerCellX),
    Math.abs(index.minCellY - centerCellY),
    Math.abs(index.maxCellY - centerCellY)
  );
}

function cellKey(cellX: number, cellY: number): string {
  return `${cellX}:${cellY}`;
}

function clampPositive(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, value);
}
