import React from 'react';
import type { Series } from '@rn-sane-charts/core';
import { buildPoints } from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import { MarkerGlyph, type MarkerStyle, type MarkerSymbol } from './markerSymbol';

export type ScatterSeriesProps = {
  series: Series;
  color?: string;
  symbol?: MarkerSymbol;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  opacity?: number;
  hitRadiusPx?: number;
};

/**
 * Draw a scatter series from core point geometry.
 *
 * Why we delegate point building to core:
 * - Keeps scale projection deterministic and testable.
 * - Reuses shared geometry path used by hit-testing/interaction layers.
 */
export function ScatterSeries(props: ScatterSeriesProps) {
  const { scales, theme, hiddenSeriesIds } = useChartContext();
  if (hiddenSeriesIds.has(props.series.id)) return null;

  const points = React.useMemo(
    () => buildPoints(props.series, scales),
    [props.series, scales]
  );

  const fallbackColor = '#2563EB';
  const color = props.color ?? theme.series.palette[0] ?? fallbackColor;
  const size = props.size ?? 8;
  const opacity = clampOpacity(props.opacity ?? 0.9);
  const marker: MarkerStyle = {
    symbol: props.symbol ?? 'circle',
    size,
    color,
    opacity,
    strokeWidth: props.strokeWidth ?? 1.5,
    filled: props.filled ?? true,
  };

  return (
    <>
      {points.map((pt, index) => (
        <MarkerGlyph
          key={`scatter-${index}-${pt.x}-${pt.y}`}
          x={pt.x}
          y={pt.y}
          {...marker}
        />
      ))}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}
