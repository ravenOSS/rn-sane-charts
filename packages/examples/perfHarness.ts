import {
  buildScatterSpatialIndex,
  findNearestNumericValue,
  findNearestPoint,
  findNearestPointInScatterIndex,
} from "@rn-sane-charts/core";

export type PerfRunResult = {
  scenario: string;
  iterations: number;
  totalMs: number;
  avgMsPerIteration: number;
};

/**
 * Run deterministic interaction performance scenarios used by the examples app.
 *
 * Why this exists:
 * - M3 requires repeatable perf checks for 5k line points and 1k scatter points.
 * - Keeping fixture generation deterministic allows easy before/after comparison
 *   across refactors without depending on production telemetry.
 */
export function runInteractionPerfHarness(): PerfRunResult[] {
  const linePoints = buildLinePoints(5_000);
  const lineAnchors = linePoints.map((point) => point.x);
  const lineByAnchor = new Map<number, typeof linePoints>();
  for (const point of linePoints) {
    const existing = lineByAnchor.get(point.x);
    if (existing) existing.push(point);
    else lineByAnchor.set(point.x, [point]);
  }

  const scatterPoints = buildScatterPoints(1_000, 20260216);
  const scatterIndex = buildScatterSpatialIndex(scatterPoints, 44);
  const queryPoints = buildQueryPoints(1_500, 20260217);

  const results: PerfRunResult[] = [];

  results.push(
    runTimedScenario("line-index-snap-5k", queryPoints.length, () => {
      for (const query of queryPoints) {
        const anchorX = findNearestNumericValue(lineAnchors, query.x);
        const bucket = lineByAnchor.get(anchorX);
        if (!bucket || bucket.length === 0) continue;
        findNearestPoint(bucket, query.x, query.y);
      }
    })
  );

  results.push(
    runTimedScenario("scatter-nearest-linear-1k", queryPoints.length, () => {
      for (const query of queryPoints) {
        findNearestPoint(scatterPoints, query.x, query.y);
      }
    })
  );

  results.push(
    runTimedScenario("scatter-nearest-indexed-1k", queryPoints.length, () => {
      for (const query of queryPoints) {
        findNearestPointInScatterIndex(scatterIndex, query.x, query.y);
      }
    })
  );

  return results;
}

function runTimedScenario(
  scenario: string,
  iterations: number,
  task: () => void
): PerfRunResult {
  const start = nowMs();
  task();
  const totalMs = nowMs() - start;
  return {
    scenario,
    iterations,
    totalMs,
    avgMsPerIteration: totalMs / Math.max(1, iterations),
  };
}

function buildLinePoints(count: number): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, index) => ({
    x: index,
    y: Math.sin(index / 18) * 32 + Math.cos(index / 45) * 12,
  }));
}

function buildScatterPoints(
  count: number,
  seed: number
): Array<{ x: number; y: number }> {
  const random = createMulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: random() * 5_000,
    y: random() * 500,
  }));
}

function buildQueryPoints(
  count: number,
  seed: number
): Array<{ x: number; y: number }> {
  const random = createMulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: random() * 5_000,
    y: random() * 500,
  }));
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nowMs(): number {
  // RN/JS runtime provides `performance.now`; fallback keeps Node tests usable.
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}
