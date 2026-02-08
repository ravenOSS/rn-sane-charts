import React from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { buildAreaPath } from '@rn-sane-charts/core';
import { useChartContext } from '../context';

export type AreaSeriesProps = {
  series: Series;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  baselineY?: number;
};

/**
 * Draw a single filled area series inside the plot region.
 *
 * Why this shape:
 * - Keeps area chart API parallel with `LineSeries` while exposing a small set
 *   of fill/stroke controls needed in business dashboards.
 * - Baseline defaults to `0` but can be overridden for specialized displays.
 */
export function AreaSeries(props: AreaSeriesProps) {
  const { scales, theme } = useChartContext();

  const { d } = React.useMemo(
    () =>
      buildAreaPath(props.series, scales, {
        baselineY: props.baselineY,
      }),
    [props.series, scales, props.baselineY]
  );

  const skPath = React.useMemo(
    () => (d ? Skia.Path.MakeFromSVGString(d) : null),
    [d]
  );

  if (!skPath) return null;

  const fillColor = props.fillColor ?? theme.series.palette[0];
  const fillOpacity = clampOpacity(props.fillOpacity ?? 0.18);
  const strokeColor = props.strokeColor ?? fillColor;
  const strokeWidth = props.strokeWidth ?? theme.series.strokeWidth;

  return (
    <>
      <Path path={skPath} style="fill" color={fillColor} opacity={fillOpacity} />
      {strokeWidth > 0 ? (
        <Path
          path={skPath}
          style="stroke"
          color={strokeColor}
          strokeWidth={strokeWidth}
        />
      ) : null}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}
