import type { Datum, Series } from "../model/types";

/**
 * Reduce point count while preserving trend shape for dense series.
 *
 * Why this transform exists:
 * - Rendering every point at high density can waste work without visual gain.
 * - A deterministic core transform lets renderers share the same sampling logic.
 *
 * Strategy:
 * - Preserve first and last points.
 * - Split interior points into buckets.
 * - Keep bucket min/max y points (in original order) to preserve spikes.
 *
 * Notes:
 * - This is not an LTTB implementation; it is an intentionally simple and
 *   predictable min/max sampler suitable for MVP.
 */
export function downsampleSeries(
  series: Series,
  options: { maxPoints: number }
): Series {
  const maxPoints = Math.floor(options.maxPoints);
  if (!Number.isFinite(maxPoints) || maxPoints < 3) return series;
  if (series.data.length <= maxPoints) return series;

  const first = series.data[0];
  const last = series.data[series.data.length - 1];
  if (!first || !last) return series;

  const interior = series.data.slice(1, -1);
  const bucketCount = Math.max(1, Math.floor((maxPoints - 2) / 2));
  const bucketSize = Math.max(1, Math.ceil(interior.length / bucketCount));

  const reduced: Datum[] = [first];
  for (let i = 0; i < interior.length; i += bucketSize) {
    const bucket = interior.slice(i, i + bucketSize);
    if (bucket.length === 0) continue;

    const minPoint = bucket.reduce((best, point) =>
      point.y < best.y ? point : best
    );
    const maxPoint = bucket.reduce((best, point) =>
      point.y > best.y ? point : best
    );

    if (minPoint === maxPoint) {
      reduced.push(minPoint);
      continue;
    }

    const minIndex = bucket.indexOf(minPoint);
    const maxIndex = bucket.indexOf(maxPoint);
    if (minIndex < maxIndex) {
      reduced.push(minPoint, maxPoint);
    } else {
      reduced.push(maxPoint, minPoint);
    }
  }

  reduced.push(last);

  // Cap final point count without dropping endpoints.
  if (reduced.length > maxPoints) {
    const head = reduced[0];
    const tail = reduced[reduced.length - 1];
    const middle = reduced.slice(1, -1);
    const keepMiddle = Math.max(0, maxPoints - 2);
    const stride = Math.max(1, Math.ceil(middle.length / keepMiddle));
    const trimmed = middle.filter((_, index) => index % stride === 0).slice(0, keepMiddle);
    return {
      id: series.id,
      data: [head as Datum, ...trimmed, tail as Datum],
    };
  }

  return {
    id: series.id,
    data: reduced,
  };
}
