// packages/core/src/transforms/binHistogram.ts

/**
 * Histogram binning for MVP.
 *
 * Why this is in core:
 * - Binning is deterministic math and easy to test.
 * - Renderer should only draw bars after binning is done.
 *
 * MVP behavior:
 * - If binCount is provided, use it.
 * - Otherwise choose a simple heuristic: sqrt(n) (common default).
 * - Returns bins with [x0, x1) ranges and count.
 *
 * Future extension:
 * - Scott's rule / Freedman–Diaconis rule
 * - Handling outliers / clamping domain
 */
export type HistogramBin = {
  x0: number;
  x1: number;
  count: number;
};

export function binHistogram(values: number[], opts?: { binCount?: number; domain?: [number, number] }): HistogramBin[] {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return [];

  const domain = opts?.domain ?? [Math.min(...clean), Math.max(...clean)];
  let [min, max] = domain;

  if (min === max) {
    // Expand degenerate domain slightly so we can form a bin.
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
    min -= pad;
    max += pad;
  }

  const n = clean.length;
  const binCount = Math.max(1, Math.floor(opts?.binCount ?? Math.sqrt(n)));

  const width = (max - min) / binCount;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => {
    const x0 = min + i * width;
    const x1 = i === binCount - 1 ? max : min + (i + 1) * width;
    return { x0, x1, count: 0 };
  });

  // Count values into bins.
  for (const v of clean) {
    // Clamp: values at max belong to the last bin.
    let idx = Math.floor((v - min) / width);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    const bin = bins[idx];
    if (bin) bin.count += 1;
  }

  return bins;
}