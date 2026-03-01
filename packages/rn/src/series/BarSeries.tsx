import React from 'react';
import { Group, Rect, Text, matchFont } from '@shopify/react-native-skia';
import {
  sortCategoricalSeries,
  type BarSortDirection,
  type BarSortBy,
  type Series,
} from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import {
  computeBarDensity,
  resolveAutoBarWidthPx,
  resolveBaselineYPx,
} from './barGeometry';
import {
  resolveVerticalBarDataLabel,
  toRNFontStyle,
  type BarDataLabelsConfig,
} from './dataLabels';

export type BarSeriesProps = {
  series: Series;
  color?: string;
  opacity?: number;
  sort?: BarSortDirection;
  sortBy?: BarSortBy;
  widthRatio?: number;
  baselineY?: number;
  dataLabels?: BarDataLabelsConfig;
};

/**
 * Draw a single bar series against the chart x/y scales.
 *
 * Width heuristic:
 * - Default behavior uses adaptive width from slot density + category count.
 * - `widthRatio` remains an override for callers that need a specific ratio.
 */
export function BarSeries(props: BarSeriesProps) {
  const {
    scales,
    theme,
    layout,
    fonts,
    hiddenSeriesIds,
    seriesColorById,
    resolveSeriesEmphasis,
  } = useChartContext();
  if (hiddenSeriesIds.has(props.series.id)) return null;
  const sortedSeries = React.useMemo(() => {
    const out = sortCategoricalSeries([props.series], {
      direction: props.sort ?? 'none',
      by: props.sortBy ?? 'value',
    });
    return out[0] ?? props.series;
  }, [props.series, props.sort, props.sortBy]);

  const fillColor =
    props.color ??
    seriesColorById.get(props.series.id) ??
    theme.series.palette[0] ??
    '#2563EB';
  const opacity = clampOpacity(props.opacity ?? 0.92);
  const y0 = resolveBaselineYPx(scales.y, props.baselineY);

  const density = React.useMemo(
    () => computeBarDensity([sortedSeries], scales.x),
    [sortedSeries, scales.x]
  );
  const barWidth = React.useMemo(() => {
    if (props.widthRatio !== undefined) {
      return Math.max(2, density.slotWidthPx * clampWidthRatio(props.widthRatio));
    }
    return resolveAutoBarWidthPx(density);
  }, [density, props.widthRatio]);
  const emphasis = resolveSeriesEmphasis(props.series.id);

  return (
    <>
      {sortedSeries.data.map((datum, index) => {
        const x = scales.x(datum.x);
        const y = scales.y(datum.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const rectY = Math.min(y0, y);
        const rectH = Math.max(1, Math.abs(y0 - y));
        const label = resolveVerticalBarDataLabel({
          dataLabels: props.dataLabels,
          value: datum.y,
          datum,
          seriesId: props.series.id,
          rect: {
            x: x - barWidth / 2,
            y: rectY,
            width: barWidth,
            height: rectH,
          },
          outsideDirection: y <= y0 ? 'up' : 'down',
          fillColor,
          defaultTextColor: theme.axis.tick.color,
          plot: layout.plot,
          measureText: fonts.measureText,
          baseFont: fonts.yTickFont,
        });
        const labelFont = label
          ? matchFont(toRNFontStyle(label.font)) ??
            matchFont({ fontSize: label.font.size }) ??
            matchFont({ fontSize: 12 })
          : null;

        return (
          <Group key={`bar-${index}-${x}-${y}`}>
            <Rect
              x={x - barWidth / 2}
              y={rectY}
              width={barWidth}
              height={rectH}
              color={fillColor}
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
