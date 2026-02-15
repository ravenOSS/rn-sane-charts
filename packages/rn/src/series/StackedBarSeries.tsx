import React from 'react';
import { Rect } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { stackSeries } from '@rn-sane-charts/core';
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
 * Why this implementation:
 * - Stacking math belongs in core so stacked bars and stacked area share the
 *   same deterministic transform and domain behavior.
 * - RN is responsible only for projection and drawing decisions.
 *
 * Behavior:
 * - Positive values stack upward from baseline; negative values stack downward.
 * - Alignment is by x-value via `stackSeries` (not by local array index).
 * - `baselineY` offsets the rendered stack without changing the core transform.
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
  const stacked = React.useMemo(
    () => stackSeries(visibleSeries.map((entry) => entry.series)),
    [visibleSeries]
  );
  const maxLen = Math.max(0, ...stacked.map((entry) => entry.data.length));

  return (
    <>
      {Array.from({ length: maxLen }, (_, index) => {
        const xDatum = stacked.find((entry) => entry.data[index])?.data[index];
        if (!xDatum) return null;
        const x = scales.x(xDatum.x as number | Date);
        if (!Number.isFinite(x)) return null;

        return visibleSeries.map((entry, visibleIndex) => {
          const stackedLayer = stacked[visibleIndex];
          const point = stackedLayer?.data[index];
          if (!point || !Number.isFinite(point.y)) return null;

          // Baseline offset is applied at render time so callers can pin bars to a
          // custom axis baseline while preserving core stack invariants.
          const startValue = baselineValue + point.y0;
          const endValue = baselineValue + point.y1;
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
