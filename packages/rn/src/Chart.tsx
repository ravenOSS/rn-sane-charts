import React from 'react';
import { View, useColorScheme } from 'react-native';
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
import type {
  ChartColorScheme,
  ChartInteraction,
  SaneChartFonts,
  SaneChartTheme,
} from './types';
import { darkTheme, lightTheme } from './theme/defaultTheme';
import { ChartContext } from './context';

export type ChartProps = {
  width: number;
  height: number;

  series: Series[];

  title?: string;
  subtitle?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  yIncludeZero?: boolean;
  formatX?: (d: Date) => string;
  formatY?: (v: number) => string;
  tickCounts?: { x?: number; y?: number };
  xTickValues?: Date[];
  xTickDomainMode?: 'slots' | 'exact';
  legend?: {
    show?: boolean;
    position?: 'auto' | 'right' | 'bottom';
    interactive?: boolean;
    interactionMode?: 'toggle' | 'isolate';
    items?: Array<{
      id: string;
      label?: string;
      color?: string;
    }>;
  };

  fonts: SaneChartFonts;
  colorScheme?: ChartColorScheme;
  interaction?: ChartInteraction;
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
  const systemColorScheme = useColorScheme();
  const xAxisTitleFont = props.fonts.xAxisTitleFont ?? props.fonts.subtitleFont;
  const yAxisTitleFont = props.fonts.yAxisTitleFont ?? props.fonts.subtitleFont;

  const resolvedColorScheme: Exclude<ChartColorScheme, 'system'> =
    props.colorScheme === 'dark' ||
    (props.colorScheme !== 'light' && systemColorScheme === 'dark')
      ? 'dark'
      : 'light';

  const theme: SaneChartTheme = React.useMemo(
    () =>
      mergeTheme(
        resolvedColorScheme === 'dark' ? darkTheme : lightTheme,
        props.theme
      ),
    [resolvedColorScheme, props.theme]
  );

  const [hiddenSeriesIds, setHiddenSeriesIds] = React.useState<string[]>([]);
  const hiddenSeriesIdSet = React.useMemo(
    () => new Set(hiddenSeriesIds),
    [hiddenSeriesIds]
  );
  const legendInteractive = props.legend?.interactive ?? false;
  const legendInteractionMode = props.legend?.interactionMode ?? 'toggle';

  React.useEffect(() => {
    const knownSeriesIds = new Set(props.series.map((series) => series.id));
    setHiddenSeriesIds((prev) =>
      prev.filter((seriesId) => knownSeriesIds.has(seriesId))
    );
  }, [props.series]);

  const visibleSeries = React.useMemo(
    () => props.series.filter((series) => !hiddenSeriesIdSet.has(series.id)),
    [props.series, hiddenSeriesIdSet]
  );
  const seriesForPlan = visibleSeries.length > 0 ? visibleSeries : props.series;

  const legendLayout = React.useMemo(() => {
    const fallbackLegendColor = '#2563EB';
    const resolveLegendColor = (index: number, inputColor?: string) =>
      inputColor ??
      theme.series.palette[index % theme.series.palette.length] ??
      fallbackLegendColor;

    const sourceItems =
      props.legend?.items ??
      props.series.map((series, index) => ({
        id: series.id,
        label: series.id,
        color: resolveLegendColor(index),
      }));

    const items: LegendItem[] = sourceItems.map((item, index) => ({
      id: item.id,
      label: item.label ?? item.id,
      color: resolveLegendColor(index, item.color),
    }));

    const explicitShow = props.legend?.show;
    const show = explicitShow ?? items.length > 1;
    if (!show || items.length === 0) {
      return {
        show: false,
        items: [],
        position: 'bottom' as const,
        orientation: 'vertical' as const,
        width: 0,
        height: 0,
        reservedRight: 0,
        reservedBottom: 0,
      };
    }

    const measured = measureLegend(items, props.fonts);
    const explicitPosition = props.legend?.position ?? 'auto';
    const position =
      explicitPosition === 'auto'
        ? resolveLegendPosition({
            chartWidth: props.width,
            legendWidth: measured.verticalWidth,
          })
        : explicitPosition;

    const availableBottomWidth = Math.max(0, props.width - 24);
    const orientation: 'horizontal' | 'vertical' =
      position === 'bottom' &&
      measured.horizontalWidth <= availableBottomWidth
        ? 'horizontal'
        : 'vertical';

    const width =
      orientation === 'horizontal'
        ? measured.horizontalWidth
        : measured.verticalWidth;
    const height =
      orientation === 'horizontal'
        ? measured.horizontalHeight
        : measured.verticalHeight;

    const reservedRight =
      position === 'right' ? measured.verticalWidth + 12 : 0;
    const reservedBottom = position === 'bottom' ? height + 10 : 0;

    return {
      show: true,
      items: measured.items,
      position,
      orientation,
      width,
      height,
      rowHeight: measured.rowHeight,
      reservedRight,
      reservedBottom,
    };
  }, [props.legend, props.series, props.fonts, props.width, theme.series.palette]);

  const plan = React.useMemo(() => {
    return buildTimeSeriesPlan({
      series: seriesForPlan,
      layoutInput: {
        width: props.width,
        height: props.height,
        padding: {
          top: 12,
          right: 12 + legendLayout.reservedRight,
          bottom: 12 + legendLayout.reservedBottom,
          left: 12,
        },
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
      yIncludeZero: props.yIncludeZero ?? false,
      tickCounts: props.tickCounts,
      xTickValues: props.xTickValues,
      xTickDomainMode: props.xTickDomainMode,
      formatX: props.formatX,
      formatY: props.formatY,
    });
  }, [
    seriesForPlan,
    props.width,
    props.height,
    props.title,
    props.subtitle,
    props.xAxisTitle,
    props.yAxisTitle,
    props.yIncludeZero,
    props.tickCounts,
    props.xTickValues,
    props.xTickDomainMode,
    props.formatX,
    props.formatY,
    legendLayout.reservedBottom,
    legendLayout.reservedRight,
    xAxisTitleFont,
    yAxisTitleFont,
    props.fonts,
  ]);

  const ctxValue = React.useMemo(
    () => ({
      layout: plan.layout,
      theme,
      fonts: props.fonts,
      hiddenSeriesIds: hiddenSeriesIdSet,
      scales: plan.scales,
    }),
    [plan.layout, plan.scales, theme, props.fonts, hiddenSeriesIdSet]
  );

  const skiaFonts = React.useMemo(
    () => ({
      xTick: matchFont(toSkiaFontStyle(props.fonts.xTickFont)),
      yTick: matchFont(toSkiaFontStyle(props.fonts.yTickFont)),
      title: matchFont(toSkiaFontStyle(props.fonts.titleFont)),
      subtitle: matchFont(toSkiaFontStyle(props.fonts.subtitleFont)),
      xAxisTitle: matchFont(toSkiaFontStyle(xAxisTitleFont)),
      yAxisTitle: matchFont(toSkiaFontStyle(yAxisTitleFont)),
      legend: matchFont(toSkiaFontStyle(props.fonts.yTickFont)),
    }),
    [
      props.fonts.xTickFont,
      props.fonts.yTickFont,
      props.fonts.titleFont,
      props.fonts.subtitleFont,
      xAxisTitleFont,
      yAxisTitleFont,
      props.fonts.yTickFont,
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

  const interactionEnabled = props.interaction?.enabled ?? false;
  const crosshairMode = props.interaction?.crosshair ?? 'x';
  const snapMode = props.interaction?.snap ?? 'nearest';
  const showTooltip = props.interaction?.tooltip ?? true;
  const responderEnabled = interactionEnabled || (legendInteractive && legendLayout.show);

  const interactiveSeriesPoints = React.useMemo(() => {
    const fallbackColor = '#2563EB';
    const points: InteractivePoint[] = [];
    const legendColorBySeriesId = new Map(
      legendLayout.items.map((item) => [item.id, item.color] as const)
    );
    const sourceSeriesIndexById = new Map(
      props.series.map((series, index) => [series.id, index] as const)
    );

    seriesForPlan.forEach((series, seriesIndex) => {
      const sourceIndex =
        sourceSeriesIndexById.get(series.id) ?? seriesIndex;
      const color =
        legendColorBySeriesId.get(series.id) ??
        theme.series.palette[sourceIndex % theme.series.palette.length] ??
        fallbackColor;
      series.data.forEach((datum, datumIndex) => {
        const px = plan.scales.x(datum.x as any);
        const py = plan.scales.y(datum.y);
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;
        if (!isInsidePlot(px, py, plan.layout.plot)) return;

        points.push({
          seriesId: series.id,
          seriesIndex,
          datumIndex,
          xValue: datum.x,
          yValue: datum.y,
          x: px,
          y: py,
          color,
          xLabel: formatInteractiveXLabel(datum.x, props.formatX),
          yLabel: formatInteractiveYLabel(datum.y, props.formatY),
        });
      });
    });

    return points;
  }, [
    seriesForPlan,
    plan.scales,
    plan.layout.plot,
    props.series,
    props.formatX,
    props.formatY,
    theme.series.palette,
    legendLayout.items,
  ]);

  const indexedXAnchors = React.useMemo(() => {
    const anchors = new Set<number>();
    for (const point of interactiveSeriesPoints) anchors.add(point.x);
    return Array.from(anchors).sort((a, b) => a - b);
  }, [interactiveSeriesPoints]);

  const [interactionState, setInteractionState] =
    React.useState<InteractionState | null>(null);

  const legendItemBoxes = React.useMemo(
    () =>
      computeLegendItemBoxes({
        chartWidth: props.width,
        chartHeight: props.height,
        layout: plan.layout,
        legend: legendLayout,
      }),
    [props.width, props.height, plan.layout, legendLayout]
  );

  const toggleSeriesByLegendId = React.useCallback(
    (seriesId: string) => {
      if (!legendInteractive) return;
      const known = new Set(props.series.map((series) => series.id));
      if (!known.has(seriesId)) return;

      setHiddenSeriesIds((prev) => {
        if (legendInteractionMode === 'isolate') {
          const visibleIds = props.series
            .map((series) => series.id)
            .filter((id) => !prev.includes(id));
          const alreadyIsolated =
            visibleIds.length === 1 && visibleIds[0] === seriesId;

          // Tap again on an already-isolated series restores all.
          if (alreadyIsolated) return [];

          // Hide everything except the selected legend item.
          return props.series
            .map((series) => series.id)
            .filter((id) => id !== seriesId);
        }

        const next = new Set(prev);
        if (next.has(seriesId)) {
          next.delete(seriesId);
          return Array.from(next);
        }

        const visibleCount = props.series.filter((series) => !next.has(series.id)).length;
        if (visibleCount <= 1) return prev;
        next.add(seriesId);
        return Array.from(next);
      });
    },
    [legendInteractive, legendInteractionMode, props.series]
  );

  /**
   * Restores full-series visibility when isolate mode is active.
   *
   * Why this exists:
   * - In isolate mode, users need a predictable way to exit "single series" view.
   * - Tapping inside the plot is a natural reset gesture that does not require
   *   targeting the already-selected legend item.
   */
  const clearLegendIsolation = React.useCallback(() => {
    if (!legendInteractive || legendInteractionMode !== 'isolate') return;
    setHiddenSeriesIds((prev) => (prev.length === 0 ? prev : []));
  }, [legendInteractive, legendInteractionMode]);

  const handleTouch = React.useCallback(
    (x: number, y: number) => {
      if (!interactionEnabled || interactiveSeriesPoints.length === 0) return;
      if (!isInsidePlot(x, y, plan.layout.plot)) {
        setInteractionState(null);
        return;
      }

      // Plot tap exits isolate mode so users can quickly restore all series.
      if (
        legendInteractive &&
        legendInteractionMode === 'isolate' &&
        hiddenSeriesIds.length > 0
      ) {
        clearLegendIsolation();
        setInteractionState(null);
        return;
      }

      if (snapMode === 'index') {
        const targetX = findNearestNumeric(indexedXAnchors, x);
        if (!Number.isFinite(targetX)) {
          setInteractionState(null);
          return;
        }

        const grouped = collectPointsAtAnchor(interactiveSeriesPoints, targetX);
        if (grouped.length === 0) {
          setInteractionState(null);
          return;
        }

        const anchor = findNearestPoint(grouped, x, y) ?? grouped[0];
        setInteractionState({
          crosshairX: targetX,
          crosshairY: anchor?.y ?? y,
          anchorXLabel: anchor?.xLabel ?? '',
          points: grouped,
        });
        return;
      }

      const nearest = findNearestPoint(interactiveSeriesPoints, x, y);
      if (!nearest) {
        setInteractionState(null);
        return;
      }

      setInteractionState({
        crosshairX: nearest.x,
        crosshairY: nearest.y,
        anchorXLabel: nearest.xLabel,
        points: [nearest],
      });
    },
    [
      interactionEnabled,
      interactiveSeriesPoints,
      plan.layout.plot,
      snapMode,
      indexedXAnchors,
      legendInteractive,
      legendInteractionMode,
      hiddenSeriesIds.length,
      clearLegendIsolation,
    ]
  );

  return (
    <View
      style={{ width: props.width, height: props.height }}
      onStartShouldSetResponder={() => responderEnabled}
      onMoveShouldSetResponder={() => interactionEnabled}
      onResponderGrant={(event) => {
        const x = event.nativeEvent.locationX;
        const y = event.nativeEvent.locationY;
        const legendHit = legendInteractive
          ? findLegendHit(legendItemBoxes, x, y)
          : null;
        if (legendHit) {
          toggleSeriesByLegendId(legendHit.id);
          setInteractionState(null);
          return;
        }
        handleTouch(x, y);
      }}
      onResponderMove={(event) =>
        handleTouch(event.nativeEvent.locationX, event.nativeEvent.locationY)
      }
      onResponderRelease={() => setInteractionState(null)}
      onResponderTerminate={() => setInteractionState(null)}
    >
      <Canvas style={{ width: props.width, height: props.height }}>
        {/* Background */}
        <SkRect
          x={0}
          y={0}
          width={props.width}
          height={props.height}
          color={theme.background}
        />
        {theme.frame.strokeWidth > 0 ? (
          <SkRect
            x={theme.frame.strokeWidth / 2}
            y={theme.frame.strokeWidth / 2}
            width={Math.max(0, props.width - theme.frame.strokeWidth)}
            height={Math.max(0, props.height - theme.frame.strokeWidth)}
            color={theme.frame.stroke}
            style="stroke"
            strokeWidth={theme.frame.strokeWidth}
          />
        ) : null}

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

        {interactionEnabled && interactionState ? (
          <Group>
            {crosshairMode === 'x' || crosshairMode === 'xy' ? (
              <Line
                p1={{
                  x: interactionState.crosshairX,
                  y: plan.layout.plot.y,
                }}
                p2={{
                  x: interactionState.crosshairX,
                  y: plan.layout.plot.y + plan.layout.plot.height,
                }}
                color={theme.axis.line.stroke}
                opacity={0.75}
                strokeWidth={1}
              />
            ) : null}
            {crosshairMode === 'xy' ? (
              <Line
                p1={{
                  x: plan.layout.plot.x,
                  y: interactionState.crosshairY,
                }}
                p2={{
                  x: plan.layout.plot.x + plan.layout.plot.width,
                  y: interactionState.crosshairY,
                }}
                color={theme.axis.line.stroke}
                opacity={0.6}
                strokeWidth={1}
              />
            ) : null}
            {showTooltip
              ? renderTooltip({
                  active: interactionState,
                  chartWidth: props.width,
                  chartHeight: props.height,
                  plot: plan.layout.plot,
                  fonts: props.fonts,
                  skiaFont: skiaFonts.yTick,
                  colorScheme: resolvedColorScheme,
                })
              : null}
          </Group>
        ) : null}

        {legendLayout.show
          ? renderLegend({
              chartWidth: props.width,
              chartHeight: props.height,
              layout: plan.layout,
              legend: legendLayout,
              font: skiaFonts.legend,
              fontSize: props.fonts.yTickFont.size,
              textColor: theme.axis.tick.color,
              hiddenSeriesIds: hiddenSeriesIdSet,
              interactive: legendInteractive,
            })
          : null}
      </Canvas>
    </View>
  );
}

/**
 * Merge caller overrides onto a concrete preset theme.
 *
 * Why this helper exists:
 * - Callers pass partial overrides, but nested objects need deterministic
 *   merging so unspecified tokens still come from the active preset.
 * - Keeping this in one place avoids ad-hoc merge logic drifting over time.
 */
function mergeTheme(
  baseTheme: SaneChartTheme,
  override?: Partial<SaneChartTheme>
): SaneChartTheme {
  if (!override) return baseTheme;
  return {
    ...baseTheme,
    ...override,
    frame: { ...baseTheme.frame, ...(override.frame ?? {}) },
    axis: {
      ...baseTheme.axis,
      ...(override.axis ?? {}),
      tick: { ...baseTheme.axis.tick, ...(override.axis?.tick ?? {}) },
      line: { ...baseTheme.axis.line, ...(override.axis?.line ?? {}) },
    },
    grid: { ...baseTheme.grid, ...(override.grid ?? {}) },
    series: {
      ...baseTheme.series,
      ...(override.series ?? {}),
      palette: override.series?.palette ?? baseTheme.series.palette,
    },
  };
}

const AXIS_TICK_SIZE_PX = 4;
const AXIS_LABEL_GAP_PX = 6;
const LEGEND_SWATCH_SIZE_PX = 9;
const LEGEND_SWATCH_TEXT_GAP_PX = 6;
const LEGEND_ITEM_GAP_PX = 6;
const LEGEND_PADDING_PX = 4;
const LEGEND_OUTER_MARGIN_PX = 6;

type LegendItem = { id: string; label: string; color: string };
type LegendMeasuredItem = LegendItem & {
  textWidth: number;
  textHeight: number;
  rowWidth: number;
};
type LegendItemBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
type InteractivePoint = {
  seriesId: string;
  seriesIndex: number;
  datumIndex: number;
  xValue: unknown;
  yValue: number;
  x: number;
  y: number;
  color: string;
  xLabel: string;
  yLabel: string;
};
type InteractionState = {
  crosshairX: number;
  crosshairY: number;
  anchorXLabel: string;
  points: InteractivePoint[];
};

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

function measureLegend(items: LegendItem[], fonts: SaneChartFonts) {
  const measuredItems: LegendMeasuredItem[] = items.map((item) => {
    const measured = fonts.measureText({
      text: item.label,
      font: fonts.yTickFont,
      angle: 0,
    });
    const textWidth = measured.width;
    const textHeight = measured.height;
    const rowWidth =
      LEGEND_SWATCH_SIZE_PX + LEGEND_SWATCH_TEXT_GAP_PX + textWidth;
    return {
      ...item,
      textWidth,
      textHeight,
      rowWidth,
    };
  });

  let maxTextWidth = 0;
  let maxTextHeight = 0;
  let horizontalContentWidth = 0;

  for (const item of measuredItems) {
    if (item.textWidth > maxTextWidth) maxTextWidth = item.textWidth;
    if (item.textHeight > maxTextHeight) maxTextHeight = item.textHeight;
    horizontalContentWidth += item.rowWidth;
  }

  const rowHeight = Math.max(LEGEND_SWATCH_SIZE_PX, maxTextHeight);
  const verticalWidth =
    LEGEND_PADDING_PX * 2 +
    LEGEND_SWATCH_SIZE_PX +
    LEGEND_SWATCH_TEXT_GAP_PX +
    maxTextWidth;
  const verticalHeight =
    LEGEND_PADDING_PX * 2 +
    items.length * rowHeight +
    Math.max(0, items.length - 1) * LEGEND_ITEM_GAP_PX;
  const horizontalWidth =
    LEGEND_PADDING_PX * 2 +
    horizontalContentWidth +
    Math.max(0, measuredItems.length - 1) * LEGEND_ITEM_GAP_PX;
  const horizontalHeight = LEGEND_PADDING_PX * 2 + rowHeight;

  return {
    items: measuredItems,
    rowHeight,
    verticalWidth,
    verticalHeight,
    horizontalWidth,
    horizontalHeight,
  };
}

function resolveLegendPosition(input: {
  chartWidth: number;
  legendWidth: number;
}): 'right' | 'bottom' {
  if (input.chartWidth >= 420 && input.legendWidth <= input.chartWidth * 0.28) {
    return 'right';
  }
  return 'bottom';
}

function renderLegend(input: {
  chartWidth: number;
  chartHeight: number;
  layout: ReturnType<typeof buildTimeSeriesPlan>['layout'];
  legend: {
    show: boolean;
    items: LegendMeasuredItem[];
    position: 'right' | 'bottom';
    orientation: 'vertical' | 'horizontal';
    width: number;
    height: number;
    rowHeight?: number;
  };
  font: ReturnType<typeof matchFont>;
  fontSize: number;
  textColor: string;
  hiddenSeriesIds: Set<string>;
  interactive: boolean;
}) {
  const itemBoxes = computeLegendItemBoxes(input);

  return (
    <Group>
      {input.legend.items.map((item, index) => {
        const box = itemBoxes[index];
        if (!box) return null;
        const hidden = input.hiddenSeriesIds.has(item.id);
        const opacity = hidden ? 0.35 : 1;
        const swatchY = box.y + Math.max(0, (box.height - LEGEND_SWATCH_SIZE_PX) / 2);
        const textX = box.x + LEGEND_SWATCH_SIZE_PX + LEGEND_SWATCH_TEXT_GAP_PX;
        const textY = box.y + baselineOffsetFromTop(input.fontSize);
        return (
          <Group key={`legend-${item.id}-${index}`}>
            <SkRect
              x={box.x}
              y={swatchY}
              width={LEGEND_SWATCH_SIZE_PX}
              height={LEGEND_SWATCH_SIZE_PX}
              color={item.color}
              opacity={opacity}
            />
            <Text
              text={item.label}
              font={input.font}
              x={textX}
              y={textY}
              color={input.textColor}
              opacity={opacity}
            />
            {input.interactive ? (
              <SkRect
                x={box.x - 2}
                y={box.y - 2}
                width={box.width + 4}
                height={box.height + 4}
                color={input.textColor}
                opacity={0.12}
                style="stroke"
                strokeWidth={hidden ? 0.75 : 0.5}
              />
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
}

function computeLegendItemBoxes(input: {
  chartWidth: number;
  chartHeight: number;
  layout: ReturnType<typeof buildTimeSeriesPlan>['layout'];
  legend: {
    show: boolean;
    items: LegendMeasuredItem[];
    position: 'right' | 'bottom';
    orientation: 'vertical' | 'horizontal';
    width: number;
    height: number;
    rowHeight?: number;
  };
}): LegendItemBox[] {
  if (!input.legend.show || input.legend.items.length === 0) return [];

  const rowHeight = input.legend.rowHeight ?? LEGEND_SWATCH_SIZE_PX;
  const startX =
    input.legend.position === 'right'
      ? input.chartWidth - input.legend.width - LEGEND_OUTER_MARGIN_PX
      : input.layout.header.x +
        Math.max(0, (input.layout.header.width - input.legend.width) / 2);
  const startY =
    input.legend.position === 'right'
      ? input.layout.plot.y + LEGEND_OUTER_MARGIN_PX
      : input.chartHeight - input.legend.height - LEGEND_OUTER_MARGIN_PX;

  return input.legend.items.map((item, index) => {
    const topY =
      input.legend.orientation === 'horizontal'
        ? startY + LEGEND_PADDING_PX
        : startY + LEGEND_PADDING_PX + index * (rowHeight + LEGEND_ITEM_GAP_PX);

    const leftX =
      input.legend.orientation === 'horizontal'
        ? startX +
          LEGEND_PADDING_PX +
          input.legend.items
            .slice(0, index)
            .reduce((acc, current) => acc + current.rowWidth, 0) +
          index * LEGEND_ITEM_GAP_PX
        : startX + LEGEND_PADDING_PX;

    return {
      id: item.id,
      x: leftX,
      y: topY,
      width: item.rowWidth,
      height: rowHeight,
    };
  });
}

function findLegendHit(
  boxes: LegendItemBox[],
  x: number,
  y: number
): LegendItemBox | null {
  for (const box of boxes) {
    if (
      x >= box.x &&
      x <= box.x + box.width &&
      y >= box.y &&
      y <= box.y + box.height
    ) {
      return box;
    }
  }
  return null;
}

function renderTooltip(input: {
  active: InteractionState;
  chartWidth: number;
  chartHeight: number;
  plot: ReturnType<typeof buildTimeSeriesPlan>['layout']['plot'];
  fonts: SaneChartFonts;
  skiaFont: ReturnType<typeof matchFont>;
  colorScheme: 'light' | 'dark';
}) {
  const padding = 8;
  const lineGap = 4;
  const rowPrefixGap = 6;
  const swatchSize = 8;
  const headerFont = input.fonts.yTickFont;

  const title = input.active.anchorXLabel;
  const titleMeasure = input.fonts.measureText({
    text: title,
    font: headerFont,
    angle: 0,
  });
  const rowMeasures = input.active.points.map((point) => {
    const rowText = `${point.seriesId}: ${point.yLabel}`;
    const m = input.fonts.measureText({
      text: rowText,
      font: input.fonts.yTickFont,
      angle: 0,
    });
    return { text: rowText, width: m.width, height: m.height, color: point.color };
  });

  const rowHeight = Math.max(
    input.fonts.yTickFont.size,
    ...rowMeasures.map((row) => row.height)
  );
  const textWidth = Math.max(titleMeasure.width, ...rowMeasures.map((row) => row.width + swatchSize + rowPrefixGap));
  const tooltipWidth = Math.ceil(textWidth + padding * 2);
  const tooltipHeight = Math.ceil(
    padding * 2 +
      titleMeasure.height +
      lineGap +
      rowMeasures.length * rowHeight +
      Math.max(0, rowMeasures.length - 1) * 2
  );

  const preferredX = input.active.crosshairX + 10;
  const preferredY = input.active.crosshairY - tooltipHeight - 10;
  const x = clamp(preferredX, 4, input.chartWidth - tooltipWidth - 4);
  const y = clamp(preferredY, 4, input.chartHeight - tooltipHeight - 4);

  const backgroundColor =
    input.colorScheme === 'dark' ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.96)';
  const strokeColor =
    input.colorScheme === 'dark' ? 'rgba(148,163,184,0.55)' : 'rgba(75,85,99,0.28)';
  const textColor = input.colorScheme === 'dark' ? '#E5E7EB' : '#111827';

  const titleBaselineY = y + padding + baselineOffsetFromTop(headerFont.size);
  const dividerY = y + padding + titleMeasure.height + 2;
  const rowsStartY = dividerY + lineGap;

  return (
    <Group>
      <SkRect
        x={x}
        y={y}
        width={tooltipWidth}
        height={tooltipHeight}
        color={backgroundColor}
      />
      <SkRect
        x={x}
        y={y}
        width={tooltipWidth}
        height={tooltipHeight}
        color={strokeColor}
        style="stroke"
        strokeWidth={1}
      />
      <Text
        text={title}
        font={input.skiaFont}
        x={x + padding}
        y={titleBaselineY}
        color={textColor}
      />
      <Line
        p1={{ x: x + padding, y: dividerY }}
        p2={{ x: x + tooltipWidth - padding, y: dividerY }}
        color={strokeColor}
        strokeWidth={1}
      />
      {rowMeasures.map((row, index) => {
        const topY = rowsStartY + index * (rowHeight + 2);
        const baselineY = topY + baselineOffsetFromTop(input.fonts.yTickFont.size);
        const swatchY = topY + Math.max(0, (rowHeight - swatchSize) / 2);
        const textX = x + padding + swatchSize + rowPrefixGap;
        return (
          <Group key={`tooltip-row-${row.text}-${index}`}>
            <SkRect
              x={x + padding}
              y={swatchY}
              width={swatchSize}
              height={swatchSize}
              color={row.color}
            />
            <Text
              text={row.text}
              font={input.skiaFont}
              x={textX}
              y={baselineY}
              color={textColor}
            />
          </Group>
        );
      })}
    </Group>
  );
}

function formatInteractiveXLabel(
  value: unknown,
  formatX?: (d: Date) => string
): string {
  if (value instanceof Date) {
    if (formatX) return formatX(value);
    return `${value.toLocaleString()}`;
  }
  return String(value);
}

function formatInteractiveYLabel(
  value: number,
  formatY?: (v: number) => string
): string {
  if (formatY) return formatY(value);
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  return Number(value.toFixed(2)).toString();
}

function findNearestPoint(
  points: InteractivePoint[],
  x: number,
  y: number
): InteractivePoint | null {
  let best: InteractivePoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const point of points) {
    const dx = point.x - x;
    const dy = point.y - y;
    const d = dx * dx + dy * dy;
    if (d < bestDistance) {
      bestDistance = d;
      best = point;
    }
  }
  return best;
}

function collectPointsAtAnchor(
  points: InteractivePoint[],
  anchorX: number
): InteractivePoint[] {
  const out: InteractivePoint[] = [];
  for (const point of points) {
    if (Math.abs(point.x - anchorX) < 0.5) out.push(point);
  }
  out.sort((a, b) => a.seriesIndex - b.seriesIndex);
  return out;
}

function findNearestNumeric(values: number[], target: number): number {
  if (values.length === 0) return Number.NaN;
  let best = values[0] ?? Number.NaN;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const value of values) {
    const d = Math.abs(value - target);
    if (d < bestDistance) {
      bestDistance = d;
      best = value;
    }
  }
  return best;
}

function isInsidePlot(
  x: number,
  y: number,
  plot: ReturnType<typeof buildTimeSeriesPlan>['layout']['plot']
): boolean {
  return (
    x >= plot.x &&
    x <= plot.x + plot.width &&
    y >= plot.y &&
    y <= plot.y + plot.height
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
