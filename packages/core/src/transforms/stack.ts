import type { Series, XValue } from "../model/types";

export type StackedPoint = {
  x: XValue;
  y: number;
  y0: number;
  y1: number;
};

export type StackedSeries = {
  id: string;
  data: StackedPoint[];
};

/**
 * Build stacked y extents (`y0`/`y1`) for aligned multi-series data.
 *
 * Why this exists:
 * - Core needs a renderer-agnostic stacking transform for stacked bars and
 *   stacked area so both chart types share consistent math.
 * - Keeping stacking in core makes totals/domains deterministic and testable.
 *
 * Behavior:
 * - Alignment is by x-value across all input series.
 * - Missing values are treated as `0`.
 * - Positive and negative values stack independently around baseline `0`.
 * - Output preserves input series order and sorted x domain order.
 */
export function stackSeries(series: readonly Series[]): StackedSeries[] {
  if (series.length === 0) return [];

  const xDomain = collectSortedXDomain(series);
  const bySeriesX = series.map((entry) => indexSeriesByX(entry));

  return series.map((entry, seriesIndex) => {
    const data: StackedPoint[] = xDomain.map((x, xIndex) => {
      let posAcc = 0;
      let negAcc = 0;

      for (let i = 0; i < seriesIndex; i += 1) {
        const prevY = bySeriesX[i]?.get(xKey(x)) ?? 0;
        if (prevY >= 0) posAcc += prevY;
        else negAcc += prevY;
      }

      const y = bySeriesX[seriesIndex]?.get(xKey(x)) ?? 0;
      const y0 = y >= 0 ? posAcc : negAcc;
      const y1 = y0 + y;

      return {
        x: xDomain[xIndex] as XValue,
        y,
        y0,
        y1,
      };
    });

    return {
      id: entry.id,
      data,
    };
  });
}

function indexSeriesByX(series: Series): Map<string, number> {
  const out = new Map<string, number>();
  for (const datum of series.data) {
    if (!datum || !Number.isFinite(datum.y)) continue;
    out.set(xKey(datum.x), datum.y);
  }
  return out;
}

function collectSortedXDomain(series: readonly Series[]): XValue[] {
  const seen = new Map<string, XValue>();

  for (const entry of series) {
    for (const datum of entry.data) {
      if (!datum) continue;
      const key = xKey(datum.x);
      if (!seen.has(key)) seen.set(key, datum.x);
    }
  }

  return Array.from(seen.values()).sort(compareXValues);
}

function compareXValues(a: XValue, b: XValue): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function xKey(x: XValue): string {
  return x instanceof Date ? `d:${x.getTime()}` : `n:${x}`;
}
