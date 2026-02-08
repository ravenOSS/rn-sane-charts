import React from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { buildLinePath } from '@rn-sane-charts/core';
import { useChartContext } from '../context';

export type LineSeriesProps = {
  series: Series;
  color?: string;
  strokeWidth?: number;
};

/**
 * Draw a single line series inside the plot region.
 *
 * Implementation note:
 * - The core package returns an SVG-style path string for determinism and easy testing.
 * - Skia can ingest that path string directly.
 */
export function LineSeries(props: LineSeriesProps) {
  const { scales, theme } = useChartContext();

  const { d } = React.useMemo(
    () => buildLinePath(props.series, scales),
    [props.series, scales]
  );
  const skPath = React.useMemo(
    () => (d ? Skia.Path.MakeFromSVGString(d) : null),
    [d]
  );

  if (!skPath) return null;

  return (
    <Path
      path={skPath}
      style="stroke"
      strokeWidth={props.strokeWidth ?? theme.series.strokeWidth}
      color={props.color ?? theme.series.palette[0]}
    />
  );
}
