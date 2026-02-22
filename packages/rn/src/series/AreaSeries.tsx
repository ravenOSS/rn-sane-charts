import React from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { buildAreaPath, buildPoints } from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import { MarkerGlyph, type MarkerStyle } from './markerSymbol';

export type AreaSeriesProps = {
  series: Series;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  baselineY?: number;
  marker?: Omit<MarkerStyle, 'color'> & { color?: string };
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
  const {
    scales,
    theme,
    hiddenSeriesIds,
    seriesColorById,
    resolveSeriesEmphasis,
  } = useChartContext();
  if (hiddenSeriesIds.has(props.series.id)) return null;

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
  const points = React.useMemo(
    () => (props.marker ? buildPoints(props.series, scales) : []),
    [props.marker, props.series, scales]
  );

  if (!skPath) return null;

  const fillColor =
    props.fillColor ??
    seriesColorById.get(props.series.id) ??
    theme.series.palette[0] ??
    '#2563EB';
  const fillOpacity = clampOpacity(props.fillOpacity ?? 0.18);
  const strokeColor = props.strokeColor ?? fillColor;
  const strokeWidth = props.strokeWidth ?? theme.series.strokeWidth;
  const emphasis = resolveSeriesEmphasis(props.series.id);

  return (
    <>
      <Path
        path={skPath}
        style="fill"
        color={fillColor}
        opacity={fillOpacity * emphasis.opacity}
      />
      {strokeWidth > 0 ? (
        <Path
          path={skPath}
          style="stroke"
          color={strokeColor}
          strokeWidth={strokeWidth * emphasis.strokeWidthMultiplier}
          opacity={emphasis.opacity}
        />
      ) : null}
      {props.marker
        ? points.map((pt, index) => (
            <MarkerGlyph
              key={`area-marker-${index}-${pt.x}-${pt.y}`}
              x={pt.x}
              y={pt.y}
              symbol={props.marker?.symbol}
              size={(props.marker?.size ?? 7) * emphasis.markerSizeMultiplier}
              color={props.marker?.color ?? strokeColor}
              opacity={(props.marker?.opacity ?? 1) * emphasis.opacity}
              strokeWidth={props.marker?.strokeWidth}
              filled={props.marker?.filled}
            />
          ))
        : null}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}
