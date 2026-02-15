import {
  buildScatterSpatialIndex,
  findNearestNumericValue,
  findNearestPoint,
  findNearestPointInScatterIndex,
} from "../../../packages/core/dist/index.js";

function runPerfHarness() {
  const linePoints = buildLinePoints(5000);
  const lineAnchors = linePoints.map((point) => point.x);
  const lineByAnchor = new Map();
  for (const point of linePoints) {
    const existing = lineByAnchor.get(point.x);
    if (existing) existing.push(point);
    else lineByAnchor.set(point.x, [point]);
  }

  const scatterPoints = buildScatterPoints(1000, 20260216);
  const scatterIndex = buildScatterSpatialIndex(scatterPoints, 44);
  const queryPoints = buildQueryPoints(1500, 20260217);

  const results = [];
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

function runTimedScenario(scenario, iterations, task) {
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

function buildLinePoints(count) {
  return Array.from({ length: count }, (_, index) => ({
    x: index,
    y: Math.sin(index / 18) * 32 + Math.cos(index / 45) * 12,
  }));
}

function buildScatterPoints(count, seed) {
  const random = createMulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: random() * 5000,
    y: random() * 500,
  }));
}

function buildQueryPoints(count, seed) {
  const random = createMulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: random() * 5000,
    y: random() * 500,
  }));
}

function createMulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

const results = runPerfHarness();
console.log("rn-sane-charts perf harness");
console.table(
  results.map((result) => ({
    scenario: result.scenario,
    iterations: result.iterations,
    total_ms: result.totalMs.toFixed(2),
    avg_ms_per_op: result.avgMsPerIteration.toFixed(4),
  }))
);
