import React from 'react';
import { Rect } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import { computeBarSlotWidthPx, resolveBaselineYPx } from './barGeometry';

export type BarSeriesProps = {
  series: Series;
  color?: string;
  opacity?: number;
  widthRatio?: number;
  baselineY?: number;
};

/**
 * Draw a single bar series against the chart x/y scales.
 *
 * Width heuristic:
 * - We infer slot width from neighboring x positions and apply `widthRatio`.
 * - This keeps bars legible across dense and sparse domains without extra props.
 */
export function BarSeries(props: BarSeriesProps) {
  const {
    scales,
    theme,
    hiddenSeriesIds,
    seriesColorById,
    resolveSeriesEmphasis,
  } = useChartContext();
  if (hiddenSeriesIds.has(props.series.id)) return null;
  const fillColor =
    props.color ??
    seriesColorById.get(props.series.id) ??
    theme.series.palette[0];
  const opacity = clampOpacity(props.opacity ?? 0.92);
  const widthRatio = clampWidthRatio(props.widthRatio ?? 0.72);
  const y0 = resolveBaselineYPx(scales.y, props.baselineY);

  const slotWidth = React.useMemo(
    () => computeBarSlotWidthPx([props.series], scales.x),
    [props.series, scales.x]
  );
  const barWidth = Math.max(2, slotWidth * widthRatio);
  const emphasis = resolveSeriesEmphasis(props.series.id);

  return (
    <>
      {props.series.data.map((datum, index) => {
        const x = scales.x(datum.x);
        const y = scales.y(datum.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const rectY = Math.min(y0, y);
        const rectH = Math.max(1, Math.abs(y0 - y));
        return (
          <Rect
            key={`bar-${index}-${x}-${y}`}
            x={x - barWidth / 2}
            y={rectY}
            width={barWidth}
            height={rectH}
            color={fillColor}
            opacity={opacity * emphasis.opacity}
          />
        );
      })}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}

function clampWidthRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.72;
  return Math.max(0.1, Math.min(1, value));
}
