// packages/core/src/geometry/linePath.ts

import { line as d3Line, curveMonotoneX } from "d3-shape";
import type { LinePath, Series } from "../model/types";

/**
 * Build an SVG-style path string for a line series.
 *
 * Why SVG path strings in core:
 * - Skia can ingest SVG path strings.
 * - Keeps geometry renderer-agnostic.
 * - Easy to snapshot-test (goldens can compare path output).
 *
 * Notes:
 * - We skip non-finite points (breaks the line).
 * - Curve choice is monotone by default, which is a good business-chart default.
 */
export function buildLinePath(series: Series, scales: { x: (v: any) => number; y: (v: number) => number }): LinePath {
  type XY = { x: any; y: number };

  const gen = d3Line()
    .x((d: XY) => scales.x(d.x))
    .y((d: XY) => scales.y(d.y))
    .defined((d: XY) => Number.isFinite(d.y) && Number.isFinite(scales.x(d.x)))
    .curve(curveMonotoneX);

  const d = gen(series.data as any) ?? "";
  return { d };
}