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

export type BarSeriesProps = {
  series: Series;
  color?: string;
  opacity?: number;
  widthRatio?: number;
  baselineY?: number;
  dataLabels?: BarDataLabelsConfig;
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
    layout,
    fonts,
    hiddenSeriesIds,
    seriesColorById,
    resolveSeriesEmphasis,
  } = useChartContext();
  if (hiddenSeriesIds.has(props.series.id)) return null;
  const fillColor =
    props.color ??
    seriesColorById.get(props.series.id) ??
    theme.series.palette[0] ??
    '#2563EB';
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
        const labelFont = label ? matchFont(toRNFontStyle(label.font)) : null;

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
