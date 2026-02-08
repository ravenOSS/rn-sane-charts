import { area as d3Area, curveMonotoneX } from "d3-shape";
import type { AreaPath, Series } from "../model/types";

/**
 * Build an SVG-style closed path string for an area series.
 *
 * Why this API exists:
 * - Area charts are a direct geometric extension of line charts.
 * - Core returns renderer-agnostic SVG path strings so RN/Skia can consume
 *   them directly while keeping chart math deterministic and testable.
 *
 * Geometry strategy:
 * - Use monotone interpolation on the upper curve (business-chart default).
 * - Trace back on a constant baseline and close the polygon.
 * - Skip non-finite data points; D3 will break/restart segments automatically.
 *
 * Invariants:
 * - Returned path is closed (`...Z`) when at least one valid segment exists.
 * - Default baseline is `0`, matching common area-chart conventions.
 */
export function buildAreaPath(
  series: Series,
  scales: { x: (v: any) => number; y: (v: number) => number },
  opts?: { baselineY?: number }
): AreaPath {
  type XY = { x: any; y: number };

  const baselineY = opts?.baselineY ?? 0;
  const baselineYPx = scales.y(baselineY);

  const gen = d3Area()
    .x((d: XY) => scales.x(d.x))
    .y0(() => baselineYPx)
    .y1((d: XY) => scales.y(d.y))
    .defined(
      (d: XY) =>
        Number.isFinite(d.y) &&
        Number.isFinite(scales.x(d.x)) &&
        Number.isFinite(scales.y(d.y))
    )
    .curve(curveMonotoneX);

  const d = gen(series.data as any) ?? "";
  return { d };
}
