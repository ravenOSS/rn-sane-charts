import React from 'react';
import { Group, Rect, Text, matchFont } from '@shopify/react-native-skia';
import type { Series } from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import { computeBarSlotWidthPx, resolveBaselineYPx } from './barGeometry';
import {
  resolveVerticalBarDataLabel,
  toRNFontStyle,
  type BarDataLabelsConfig,
} from './dataLabels';

export type GroupedBarSeriesProps = {
  series: Series[];
  colors?: readonly string[];
  opacity?: number;
  groupWidthRatio?: number;
  baselineY?: number;
  dataLabels?: BarDataLabelsConfig;
};

/**
 * Draw grouped bars for multiple series sharing the same x slots.
 *
 * Assumption:
 * - Series are aligned by datum index (same x positions in each series).
 * - Missing points are skipped safely.
 */
export function GroupedBarSeries(props: GroupedBarSeriesProps) {
  const { scales, theme, layout, fonts, hiddenSeriesIds, resolveSeriesEmphasis } =
    useChartContext();
  const opacity = clampOpacity(props.opacity ?? 0.92);
  const groupWidthRatio = clampRatio(props.groupWidthRatio ?? 0.82);
  const y0 = resolveBaselineYPx(scales.y, props.baselineY);
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

  const groupWidth = Math.max(4, slotWidth * groupWidthRatio);
  const seriesCount = Math.max(1, visibleSeries.length);
  const barWidth = Math.max(2, groupWidth / seriesCount);

  return (
    <>
      {visibleSeries.map((entry, visibleIndex) =>
        entry.series.data.map((datum, index) => {
          const x = scales.x(datum.x);
          const y = scales.y(datum.y);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

          const startX = x - groupWidth / 2;
          const barX = startX + visibleIndex * barWidth;
          const rectY = Math.min(y0, y);
          const rectH = Math.max(1, Math.abs(y0 - y));

          const color =
            props.colors?.[entry.sourceIndex] ??
            theme.series.palette[entry.sourceIndex % theme.series.palette.length] ??
            '#2563EB';
          const emphasis = resolveSeriesEmphasis(entry.series.id);
          const label = resolveVerticalBarDataLabel({
            dataLabels: props.dataLabels,
            value: datum.y,
            datum,
            seriesId: entry.series.id,
            rect: {
              x: barX,
              y: rectY,
              width: barWidth,
              height: rectH,
            },
            outsideDirection: y <= y0 ? 'up' : 'down',
            fillColor: color,
            defaultTextColor: theme.axis.tick.color,
            plot: layout.plot,
            measureText: fonts.measureText,
            baseFont: fonts.yTickFont,
          });
          const labelFont = label ? matchFont(toRNFontStyle(label.font)) : null;

          return (
            <Group key={`grouped-${entry.series.id}-${index}-${barX}-${rectY}`}>
              <Rect
                x={barX}
                y={rectY}
                width={barWidth}
                height={rectH}
                color={color}
                opacity={opacity * emphasis.opacity}
              />
              {label && labelFont ? (
                <Text
                  text={label.text}
                  font={labelFont}
                  x={label.x}
                  y={label.baselineY}
                  color={label.color}
                  opacity={opacity * emphasis.opacity}
                />
              ) : null}
            </Group>
          );
        })
      )}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.82;
  return Math.max(0.1, Math.min(1, value));
}
