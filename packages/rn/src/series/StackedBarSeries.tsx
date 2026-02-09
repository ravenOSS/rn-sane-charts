import React from 'react';
import { Rect } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import { computeBarSlotWidthPx } from './barGeometry';

export type StackedBarSeriesProps = {
  series: Series[];
  colors?: readonly string[];
  opacity?: number;
  widthRatio?: number;
  baselineY?: number;
};

/**
 * Draw stacked bars from multiple aligned series.
 *
 * Current behavior:
 * - Positive values stack upward from baseline.
 * - Negative values stack downward from baseline.
 * - Alignment is by datum index per series.
 */
export function StackedBarSeries(props: StackedBarSeriesProps) {
  const { scales, theme, hiddenSeriesIds } = useChartContext();
  const opacity = clampOpacity(props.opacity ?? 0.92);
  const widthRatio = clampRatio(props.widthRatio ?? 0.72);
  const baselineValue = props.baselineY ?? 0;
  const visibleSeries = React.useMemo(
    () =>
      props.series
        .map((series, sourceIndex) => ({ series, sourceIndex }))
        .filter((entry) => !hiddenSeriesIds.has(entry.series.id)),
    [props.series, hiddenSeriesIds]
  );

  const slotWidth = React.useMemo(
    () => computeBarSlotWidthPx(visibleSeries.map((entry) => entry.series), scales.x),
    [visibleSeries, scales.x]
  );
  const barWidth = Math.max(2, slotWidth * widthRatio);

  const maxLen = Math.max(0, ...visibleSeries.map((entry) => entry.series.data.length));
  return (
    <>
      {Array.from({ length: maxLen }, (_, index) => {
        const xDatum = visibleSeries.find((entry) => entry.series.data[index])?.series.data[index];
        if (!xDatum) return null;
        const x = scales.x(xDatum.x);
        if (!Number.isFinite(x)) return null;

        let posAcc = baselineValue;
        let negAcc = baselineValue;

        return visibleSeries.map((entry, visibleIndex) => {
          const datum = entry.series.data[index];
          if (!datum || !Number.isFinite(datum.y)) return null;

          const yValue = datum.y;
          const startValue = yValue >= 0 ? posAcc : negAcc;
          const endValue = startValue + yValue;
          if (yValue >= 0) {
            posAcc = endValue;
          } else {
            negAcc = endValue;
          }

          const yStartPx = scales.y(startValue);
          const yEndPx = scales.y(endValue);
          if (!Number.isFinite(yStartPx) || !Number.isFinite(yEndPx)) return null;

          // When scale projection collapses near baseline, keep a visible sliver.
          const rectY = Math.min(yStartPx, yEndPx);
          const rectH = Math.max(1, Math.abs(yStartPx - yEndPx));
          const color =
            props.colors?.[entry.sourceIndex] ??
            theme.series.palette[entry.sourceIndex % theme.series.palette.length];

          return (
            <Rect
              key={`stacked-${entry.series.id}-${index}-${visibleIndex}-${x}`}
              x={x - barWidth / 2}
              y={rectY}
              width={barWidth}
              height={rectH}
              color={color}
              opacity={opacity}
            />
          );
        });
      })}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.72;
  return Math.max(0.1, Math.min(1, value));
}
