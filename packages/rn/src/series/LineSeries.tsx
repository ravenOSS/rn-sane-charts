import React from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { buildLinePath, buildPoints } from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import { MarkerGlyph, type MarkerStyle } from './markerSymbol';

export type LineSeriesProps = {
  series: Series;
  color?: string;
  strokeWidth?: number;
  marker?: Omit<MarkerStyle, 'color'> & { color?: string };
};

/**
 * Draw a single line series inside the plot region.
 *
 * Implementation note:
 * - The core package returns an SVG-style path string for determinism and easy testing.
 * - Skia can ingest that path string directly.
 */
export function LineSeries(props: LineSeriesProps) {
  const {
    scales,
    theme,
    hiddenSeriesIds,
    seriesColorById,
    resolveSeriesEmphasis,
  } = useChartContext();
  if (hiddenSeriesIds.has(props.series.id)) return null;

  const { d } = React.useMemo(
    () => buildLinePath(props.series, scales),
    [props.series, scales]
  );
  const skPath = React.useMemo(
    () => (d ? Skia.Path.MakeFromSVGString(d) : null),
    [d]
  );
  const points = React.useMemo(
    () => (props.marker ? buildPoints(props.series, scales) : []),
    [props.marker, props.series, scales]
  );

  if (!skPath) return null;

  const lineColor =
    props.color ??
    seriesColorById.get(props.series.id) ??
    theme.series.palette[0] ??
    '#2563EB';
  const emphasis = resolveSeriesEmphasis(props.series.id);

  return (
    <>
      <Path
        path={skPath}
        style="stroke"
        strokeWidth={
          (props.strokeWidth ?? theme.series.strokeWidth) *
          emphasis.strokeWidthMultiplier
        }
        color={lineColor}
        opacity={emphasis.opacity}
      />
      {props.marker
        ? points.map((pt, index) => (
            <MarkerGlyph
              key={`line-marker-${index}-${pt.x}-${pt.y}`}
              x={pt.x}
              y={pt.y}
              symbol={props.marker?.symbol}
              size={(props.marker?.size ?? 7) * emphasis.markerSizeMultiplier}
              color={props.marker?.color ?? lineColor}
              opacity={(props.marker?.opacity ?? 1) * emphasis.opacity}
              strokeWidth={props.marker?.strokeWidth}
              filled={props.marker?.filled}
            />
          ))
        : null}
    </>
  );
}
