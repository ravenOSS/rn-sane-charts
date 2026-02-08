import React from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Group,
  Line,
  matchFont,
  Rect as SkRect,
  Text,
} from '@shopify/react-native-skia';

import type { Series } from '@rn-sane-charts/core';
import { buildTimeSeriesPlan } from '@rn-sane-charts/core';
import type { SaneChartFonts, SaneChartTheme } from './types';
import { defaultTheme } from './theme/defaultTheme';
import { ChartContext } from './context';

export type ChartProps = {
  width: number;
  height: number;

  series: Series[];

  title?: string;
  subtitle?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;

  fonts: SaneChartFonts;
  theme?: Partial<SaneChartTheme>;

  /** Children are series components, axes, etc. */
  children: React.ReactNode;
};

/**
 * Chart root component.
 *
 * Responsibilities:
 * - Runs core planning (validation, domains, scales, ticks, layout decisions)
 * - Hosts the Skia canvas and plot clipping
 * - Provides `ChartContext` for series renderers (scales/layout/theme/fonts)
 *
 * Non-goals (MVP):
 * - Web renderer
 * - Pluggable composition systems
 */
export function Chart(props: ChartProps) {
  const xAxisTitleFont = props.fonts.xAxisTitleFont ?? props.fonts.subtitleFont;
  const yAxisTitleFont = props.fonts.yAxisTitleFont ?? props.fonts.subtitleFont;

  const theme: SaneChartTheme = React.useMemo(
    () => ({
      ...defaultTheme,
      ...props.theme,
      axis: { ...defaultTheme.axis, ...(props.theme?.axis ?? {}) },
      grid: { ...defaultTheme.grid, ...(props.theme?.grid ?? {}) },
      series: { ...defaultTheme.series, ...(props.theme?.series ?? {}) },
    }),
    [props.theme]
  );

  const plan = React.useMemo(() => {
    return buildTimeSeriesPlan({
      series: props.series,
      layoutInput: {
        width: props.width,
        height: props.height,
        padding: { top: 12, right: 12, bottom: 12, left: 12 },
        text: {
          title: props.title,
          subtitle: props.subtitle,
          titleFont: props.fonts.titleFont,
          subtitleFont: props.fonts.subtitleFont,
        },
        xAxis: {
          show: true,
          title: props.xAxisTitle,
          tickFont: props.fonts.xTickFont,
          titleFont: xAxisTitleFont,
        },
        yAxis: {
          show: true,
          title: props.yAxisTitle,
          tickFont: props.fonts.yTickFont,
          titleFont: yAxisTitleFont,
        },
        measureText: props.fonts.measureText,
      },
      yIncludeZero: false,
    });
  }, [
    props.series,
    props.width,
    props.height,
    props.title,
    props.subtitle,
    props.xAxisTitle,
    props.yAxisTitle,
    xAxisTitleFont,
    yAxisTitleFont,
    props.fonts,
  ]);

  const ctxValue = React.useMemo(
    () => ({
      layout: plan.layout,
      theme,
      fonts: props.fonts,
      scales: plan.scales,
    }),
    [plan.layout, plan.scales, theme, props.fonts]
  );

  const skiaFonts = React.useMemo(
    () => ({
      xTick: matchFont(toSkiaFontStyle(props.fonts.xTickFont)),
      yTick: matchFont(toSkiaFontStyle(props.fonts.yTickFont)),
      title: matchFont(toSkiaFontStyle(props.fonts.titleFont)),
      subtitle: matchFont(toSkiaFontStyle(props.fonts.subtitleFont)),
      xAxisTitle: matchFont(toSkiaFontStyle(xAxisTitleFont)),
      yAxisTitle: matchFont(toSkiaFontStyle(yAxisTitleFont)),
    }),
    [
      props.fonts.xTickFont,
      props.fonts.yTickFont,
      props.fonts.titleFont,
      props.fonts.subtitleFont,
      xAxisTitleFont,
      yAxisTitleFont,
    ]
  );

  const axisGeometry = React.useMemo(
    () =>
      buildAxisGeometry({
        layout: plan.layout,
        xTicks: plan.ticks.x,
        yTicks: plan.ticks.y,
        title: props.title,
        subtitle: props.subtitle,
        xAxisTitle: props.xAxisTitle,
        yAxisTitle: props.yAxisTitle,
        fonts: props.fonts,
      }),
    [
      plan.layout,
      plan.ticks.x,
      plan.ticks.y,
      props.title,
      props.subtitle,
      props.xAxisTitle,
      props.yAxisTitle,
      props.fonts,
    ]
  );

  return (
    <View style={{ width: props.width, height: props.height }}>
      <Canvas style={{ width: props.width, height: props.height }}>
        {/* Background */}
        <SkRect
          x={0}
          y={0}
          width={props.width}
          height={props.height}
          color={theme.background}
        />

        {/* Clip series rendering to plot bounds */}
        <Group
          clip={{
            x: plan.layout.plot.x,
            y: plan.layout.plot.y,
            width: plan.layout.plot.width,
            height: plan.layout.plot.height,
          }}
        >
          <ChartContext.Provider value={ctxValue}>
            {props.children}
          </ChartContext.Provider>
        </Group>

        {/* Header text */}
        {props.title ? (
          <Text
            text={props.title}
            font={skiaFonts.title}
            x={axisGeometry.titleX}
            y={axisGeometry.titleBaselineY}
            color={theme.axis.tick.color}
          />
        ) : null}
        {props.subtitle ? (
          <Text
            text={props.subtitle}
            font={skiaFonts.subtitle}
            x={axisGeometry.subtitleX}
            y={axisGeometry.subtitleBaselineY}
            color={theme.axis.tick.color}
          />
        ) : null}
        {props.xAxisTitle ? (
          <Text
            text={props.xAxisTitle}
            font={skiaFonts.xAxisTitle}
            x={axisGeometry.xAxisTitleX}
            y={axisGeometry.xAxisTitleBaselineY}
            color={theme.axis.tick.color}
          />
        ) : null}
        {props.yAxisTitle ? (
          <Group
            transform={[
              { translateX: axisGeometry.yAxisTitleCenterX },
              { translateY: axisGeometry.yAxisTitleCenterY },
              { rotate: -Math.PI / 2 },
            ]}
          >
            <Text
              text={props.yAxisTitle}
              font={skiaFonts.yAxisTitle}
              x={axisGeometry.yAxisTitleLocalX}
              y={axisGeometry.yAxisTitleBaselineOffset}
              color={theme.axis.tick.color}
            />
          </Group>
        ) : null}

        {/* Axes */}
        <Line
          p1={{ x: axisGeometry.yAxisX, y: plan.layout.plot.y }}
          p2={{
            x: axisGeometry.yAxisX,
            y: plan.layout.plot.y + plan.layout.plot.height,
          }}
          color={theme.axis.line.stroke}
          strokeWidth={theme.axis.line.strokeWidth}
        />
        <Line
          p1={{ x: plan.layout.plot.x, y: axisGeometry.xAxisY }}
          p2={{
            x: plan.layout.plot.x + plan.layout.plot.width,
            y: axisGeometry.xAxisY,
          }}
          color={theme.axis.line.stroke}
          strokeWidth={theme.axis.line.strokeWidth}
        />

        {/* Y ticks + labels */}
        {plan.ticks.y.map((tick, index) => (
          <Group key={`y-${index}-${tick.value}`}>
            <Line
              p1={{ x: axisGeometry.yAxisX - AXIS_TICK_SIZE_PX, y: tick.y }}
              p2={{ x: axisGeometry.yAxisX, y: tick.y }}
              color={theme.axis.line.stroke}
              strokeWidth={theme.axis.line.strokeWidth}
            />
            <Text
              text={tick.label}
              font={skiaFonts.yTick}
              x={axisGeometry.yLabels[index]?.x ?? axisGeometry.yAxisX}
              y={axisGeometry.yLabels[index]?.baselineY ?? tick.y}
              color={theme.axis.tick.color}
            />
          </Group>
        ))}

        {/* X ticks + labels. Rotation follows core's collision decision. */}
        {plan.ticks.x.map((tick, index) => (
          <Group key={`x-${index}-${String(tick.value)}`}>
            <Line
              p1={{ x: tick.x, y: axisGeometry.xAxisY }}
              p2={{ x: tick.x, y: axisGeometry.xAxisY + AXIS_TICK_SIZE_PX }}
              color={theme.axis.line.stroke}
              strokeWidth={theme.axis.line.strokeWidth}
            />
            <Group
              transform={[
                { translateX: tick.x },
                { translateY: axisGeometry.xLabelTopY },
                { rotate: axisGeometry.xLabelAngleRad },
              ]}
            >
              <Text
                text={tick.label}
                font={skiaFonts.xTick}
                x={axisGeometry.xLabels[index]?.localX ?? 0}
                y={
                  axisGeometry.xLabels[index]?.baselineOffset ??
                  baselineOffsetFromTop(props.fonts.xTickFont.size)
                }
                color={theme.axis.tick.color}
              />
            </Group>
          </Group>
        ))}
      </Canvas>
    </View>
  );
}

const AXIS_TICK_SIZE_PX = 4;
const AXIS_LABEL_GAP_PX = 6;

/**
 * Build concrete coordinates for RN/Skia axis rendering from core decisions.
 *
 * Why keep this separate from JSX:
 * - Makes chart rendering declarative while keeping geometry math isolated.
 * - Ensures all text placement is computed once and reused by draw calls.
 *
 * Important invariants:
 * - `core` decides which ticks and x-label angle are safe to show.
 * - RN renderer only translates those decisions into concrete pixel positions.
 */
function buildAxisGeometry(input: {
  layout: ReturnType<typeof buildTimeSeriesPlan>['layout'];
  xTicks: ReturnType<typeof buildTimeSeriesPlan>['ticks']['x'];
  yTicks: ReturnType<typeof buildTimeSeriesPlan>['ticks']['y'];
  title?: string;
  subtitle?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  fonts: SaneChartFonts;
}) {
  const xAxisY = input.layout.xAxis.y;
  const yAxisX = input.layout.yAxis.x + input.layout.yAxis.width;
  const xLabelTopY = xAxisY + AXIS_TICK_SIZE_PX + AXIS_LABEL_GAP_PX;

  const xLabelAngleDeg = input.layout.decisions.xAxis.labelAngle;
  const xLabelAngleRad = (-xLabelAngleDeg * Math.PI) / 180;

  const xLabels = input.xTicks.map((tick) => {
    const measured = input.fonts.measureText({
      text: tick.label,
      font: input.fonts.xTickFont,
      angle: 0,
    });
    const isHorizontal = Math.abs(xLabelAngleDeg) < 0.001;
    /**
     * Anchor strategy:
     * - 0deg labels are centered on the tick.
     * - Rotated labels are end-aligned so the label's right edge sits on the tick.
     *
     * Why:
     * - Keeps every rotated label starting from a consistent axis offset line.
     * - Places the most specific date token (usually day numeral at string end)
     *   closest to the axis, improving scanability.
     */
    const localX = isHorizontal ? -measured.width / 2 : -measured.width;
    const baselineOffset = baselineOffsetFromTop(input.fonts.xTickFont.size);
    return { localX, baselineOffset };
  });

  const yLabels = input.yTicks.map((tick) => {
    const measured = input.fonts.measureText({
      text: tick.label,
      font: input.fonts.yTickFont,
      angle: 0,
    });
    const x = yAxisX - AXIS_TICK_SIZE_PX - AXIS_LABEL_GAP_PX - measured.width;
    const topY = tick.y - measured.height / 2;
    const baselineY = topY + baselineOffsetFromTop(input.fonts.yTickFont.size);
    return { x, baselineY };
  });

  const titleMeasured = input.title
    ? input.fonts.measureText({
        text: input.title,
        font: input.fonts.titleFont,
        angle: 0,
      })
    : null;
  const subtitleMeasured = input.subtitle
    ? input.fonts.measureText({
        text: input.subtitle,
        font: input.fonts.subtitleFont,
        angle: 0,
      })
    : null;

  const titleHeight = titleMeasured?.height ?? 0;
  const titleTopY = input.layout.header.y;
  const titleBaselineY =
    titleTopY + baselineOffsetFromTop(input.fonts.titleFont.size);
  const titleX =
    input.layout.header.x +
    Math.max(0, (input.layout.header.width - (titleMeasured?.width ?? 0)) / 2);

  const subtitleTopY =
    titleTopY + titleHeight + (input.title && input.subtitle ? 4 : 0);
  const subtitleBaselineY =
    subtitleTopY + baselineOffsetFromTop(input.fonts.subtitleFont.size);
  const subtitleX =
    input.layout.header.x +
    Math.max(
      0,
      (input.layout.header.width - (subtitleMeasured?.width ?? 0)) / 2
    );

  const xAxisTitleFont = input.fonts.xAxisTitleFont ?? input.fonts.subtitleFont;
  const yAxisTitleFont = input.fonts.yAxisTitleFont ?? input.fonts.subtitleFont;

  const xAxisTitleMeasured = input.xAxisTitle
    ? input.fonts.measureText({
        text: input.xAxisTitle,
        font: xAxisTitleFont,
        angle: 0,
      })
    : null;
  /**
   * Keep chart heading and x-axis title aligned to the same visual center datum.
   *
   * Why:
   * - Header text is centered within `layout.header` (full chart width minus padding).
   * - If x-axis title centers on `layout.plot`, it shifts right whenever y-axis labels
   *   consume left-side width, which feels unbalanced.
   */
  const xAxisTitleX =
    input.layout.header.x +
    Math.max(0, (input.layout.header.width - (xAxisTitleMeasured?.width ?? 0)) / 2);
  const xAxisTitleTopY =
    input.layout.xAxis.y +
    Math.max(0, input.layout.xAxis.height - (xAxisTitleMeasured?.height ?? 0));
  const xAxisTitleBaselineY =
    xAxisTitleTopY + baselineOffsetFromTop(xAxisTitleFont.size);

  const yAxisTitleMeasured = input.yAxisTitle
    ? input.fonts.measureText({
        text: input.yAxisTitle,
        font: yAxisTitleFont,
        angle: 0,
      })
    : null;
  const yAxisTitleBandWidth = input.yAxisTitle
    ? input.fonts.measureText({
        text: input.yAxisTitle,
        font: yAxisTitleFont,
        angle: 90,
      }).width
    : 0;
  const yAxisTitleCenterX = input.layout.yAxis.x + yAxisTitleBandWidth / 2;
  const yAxisTitleCenterY = input.layout.plot.y + input.layout.plot.height / 2;
  const yAxisTitleLocalX = -((yAxisTitleMeasured?.width ?? 0) / 2);
  const yAxisTitleBaselineOffset =
    -((yAxisTitleMeasured?.height ?? 0) / 2) +
    baselineOffsetFromTop(yAxisTitleFont.size);

  return {
    xAxisY,
    yAxisX,
    xLabelTopY,
    xLabelAngleRad,
    xLabels,
    yLabels,
    titleX,
    titleBaselineY,
    subtitleX,
    subtitleBaselineY,
    xAxisTitleX,
    xAxisTitleBaselineY,
    yAxisTitleCenterX,
    yAxisTitleCenterY,
    yAxisTitleLocalX,
    yAxisTitleBaselineOffset,
  };
}

/**
 * Convert core font specs into Skia's `matchFont()` style input.
 *
 * We normalize custom semantic weights (e.g. `semibold`) so the same
 * token can be used for layout and render without leaking Skia-specific
 * font APIs into core.
 */
function toSkiaFontStyle(font: SaneChartFonts['xTickFont']) {
  return {
    fontFamily: font.family,
    fontSize: font.size,
    fontStyle: font.style,
    fontWeight: normalizeFontWeight(font.weight),
  };
}

function normalizeFontWeight(
  weight: SaneChartFonts['xTickFont']['weight']
): SkiaFontWeight {
  if (weight === undefined) return '400';
  if (typeof weight === 'number') {
    const normalized = String(weight) as SkiaFontWeight;
    const supportedWeights: SkiaFontWeight[] = [
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
    ];
    return supportedWeights.includes(normalized) ? normalized : '400';
  }
  if (weight === 'semibold') return '600';
  if (weight === 'medium') return '500';
  if (weight === 'bold') return '700';
  return '400';
}

type SkiaFontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

/**
 * Conservative ascent estimate when we don't have renderer font metrics.
 *
 * Skia text APIs position glyphs by baseline (`y`), while core layout
 * budgets by box height. A stable ascent heuristic keeps labels vertically
 * centered and avoids clipping without coupling layout to renderer internals.
 */
function baselineOffsetFromTop(fontSize: number) {
  return Math.round(fontSize * 0.8);
}
