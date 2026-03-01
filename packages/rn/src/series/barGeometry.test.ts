import { describe, expect, it } from 'vitest';
import type { Series } from '@rn-sane-charts/core';
import {
  computeBarDensity,
  resolveAutoBarWidthPx,
  resolveAutoGroupedBarGeometry,
} from './barGeometry';

const xScale = (value: unknown) => Number(value);

function series(id: string, xs: number[]): Series {
  return {
    id,
    data: xs.map((x, index) => ({ x, y: index + 1 })),
  };
}

describe('bar geometry', () => {
  it('computes slot width and unique category count from projected x values', () => {
    const density = computeBarDensity(
      [series('a', [0, 20, 40]), series('b', [0, 20, 40])],
      xScale
    );
    expect(density.slotWidthPx).toBe(20);
    expect(density.categoryCount).toBe(3);
  });

  it('uses narrower occupancy on sparse categories', () => {
    const sparse = resolveAutoBarWidthPx({
      slotWidthPx: 80,
      categoryCount: 3,
    });
    const dense = resolveAutoBarWidthPx({
      slotWidthPx: 80,
      categoryCount: 14,
    });
    expect(sparse).toBeLessThan(dense);
  });

  it('preserves a minimum gap between category bars', () => {
    const width = resolveAutoBarWidthPx({
      slotWidthPx: 18,
      categoryCount: 10,
      minGapPx: 3,
    });
    expect(18 - width).toBeGreaterThanOrEqual(3);
  });

  it('inserts inner gaps for grouped bars when there is room', () => {
    const grouped = resolveAutoGroupedBarGeometry({
      slotWidthPx: 40,
      categoryCount: 8,
      seriesCount: 3,
    });
    expect(grouped.innerGapPx).toBeGreaterThan(0);
    expect(grouped.barWidthPx).toBeGreaterThan(2);
    expect(grouped.barWidthPx * 3 + grouped.innerGapPx * 2).toBeCloseTo(
      grouped.groupWidthPx
    );
  });
});
