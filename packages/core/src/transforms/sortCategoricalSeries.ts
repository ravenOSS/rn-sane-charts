import type { Series, XValue } from '../model/types';

export type BarSortDirection = 'none' | 'asc' | 'desc';
export type BarSortBy = 'value' | 'label';
export type MultiSeriesSortMetric = 'sum' | 'firstSeries';

export type SortCategoricalSeriesOptions = {
  direction?: BarSortDirection;
  by?: BarSortBy;
  metric?: MultiSeriesSortMetric;
};

/**
 * Sort one or many categorical bar series by label or aggregate value.
 *
 * Why this lives in core:
 * - Sorting is deterministic data shaping, not renderer behavior.
 * - Grouped and stacked bars both require aligned category ordering across all
 *   series; centralizing this avoids divergent implementations in RN renderers.
 *
 * Behavior:
 * - `direction: 'none'` preserves caller order.
 * - Missing category values are normalized to `0` so multi-series rows remain
 *   aligned after sorting.
 * - Sorting is stable: equal keys keep original input order.
 */
export function sortCategoricalSeries(
  series: readonly Series[],
  options: SortCategoricalSeriesOptions = {}
): Series[] {
  const direction = options.direction ?? 'none';
  if (series.length === 0) return [];
  if (direction === 'none') return series.map(cloneSeries);

  const by = options.by ?? 'value';
  const metric = options.metric ?? 'sum';
  const rows = buildAlignedRows(series);
  const sorted = rows
    .map((row, index) => ({ ...row, index }))
    .sort((a, b) => {
      const keyCompare =
        by === 'label'
          ? compareXValues(a.x, b.x)
          : compareMetric(a.values, b.values, metric);
      if (keyCompare !== 0) return direction === 'asc' ? keyCompare : -keyCompare;
      return a.index - b.index;
    });

  return series.map((entry, seriesIndex) => ({
    id: entry.id,
    data: sorted.map((row) => ({
      x: row.x,
      y: row.values[seriesIndex] ?? 0,
    })),
  }));
}

type AlignedRow = {
  x: XValue;
  values: number[];
};

function buildAlignedRows(series: readonly Series[]): AlignedRow[] {
  const xDomain = collectStableXDomain(series);
  const rowByKey = new Map<string, AlignedRow>(
    xDomain.map((x) => [xKey(x), { x, values: new Array(series.length).fill(0) }])
  );

  series.forEach((entry, seriesIndex) => {
    entry.data.forEach((datum) => {
      const row = rowByKey.get(xKey(datum.x));
      if (!row) return;
      row.values[seriesIndex] = Number.isFinite(datum.y) ? datum.y : 0;
    });
  });

  return xDomain
    .map((x) => rowByKey.get(xKey(x)))
    .filter((row): row is AlignedRow => row !== undefined);
}

function collectStableXDomain(series: readonly Series[]): XValue[] {
  const seen = new Set<string>();
  const out: XValue[] = [];

  series.forEach((entry) => {
    entry.data.forEach((datum) => {
      const key = xKey(datum.x);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(datum.x);
    });
  });

  return out;
}

function compareMetric(
  valuesA: number[],
  valuesB: number[],
  metric: MultiSeriesSortMetric
): number {
  if (metric === 'firstSeries') return (valuesA[0] ?? 0) - (valuesB[0] ?? 0);
  return sum(valuesA) - sum(valuesB);
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
}

function compareXValues(a: XValue, b: XValue): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function cloneSeries(entry: Series): Series {
  return {
    id: entry.id,
    data: entry.data.map((datum) => ({ ...datum })),
  };
}

function xKey(x: XValue): string {
  return x instanceof Date ? `d:${x.getTime()}` : `n:${x}`;
}
