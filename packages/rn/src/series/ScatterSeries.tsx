import React from 'react';
import { Circle } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { buildPoints } from '@rn-sane-charts/core';
import { useChartContext } from '../context';

export type ScatterSeriesProps = {
  series: Series;
  color?: string;
  radius?: number;
  opacity?: number;
};

/**
 * Draw a scatter series from core point geometry.
 *
 * Why we delegate point building to core:
 * - Keeps scale projection deterministic and testable.
 * - Reuses shared geometry path used by hit-testing/interaction layers.
 */
export function ScatterSeries(props: ScatterSeriesProps) {
  const { scales, theme } = useChartContext();

  const points = React.useMemo(
    () => buildPoints(props.series, scales),
    [props.series, scales]
  );

  const color = props.color ?? theme.series.palette[0];
  const radius = props.radius ?? 4;
  const opacity = clampOpacity(props.opacity ?? 0.9);

  return (
    <>
      {points.map((pt, index) => (
        <Circle
          key={`scatter-${index}-${pt.x}-${pt.y}`}
          cx={pt.x}
          cy={pt.y}
          r={radius}
          color={color}
          opacity={opacity}
        />
      ))}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}
