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

import type {
  LegendItem as CoreLegendItem,
  LegendLayoutResult,
  Series,
} from '@rn-sane-charts/core';
import {
  buildTimeSeriesPlan,
  buildScatterSpatialIndex,
  computeLegendItemBoxes,
  computeLegendLayout,
  findLegendHit,
  findNearestNumericValue,
  findNearestPointInScatterIndex,
  findNearestPoint,
  isPointInRect,
} from '@rn-sane-charts/core';
import type {
  ChartColorScheme,
  ChartInteraction,
  LegendInteractionMode,
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
    interactionMode?: LegendInteractionMode;
    items?: Array<{
      id: string;
      label?: string;
      color?: string;
    }>;
  };
  annotations?: {
    markers?: Array<{
      id?: string;
      x: number | Date;
      y: number;
      label?: string;
      color?: string;
      size?: number;
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
  const [focusedSeriesId, setFocusedSeriesId] = React.useState<string | null>(null);
  const hiddenSeriesIdSet = React.useMemo(
    () => new Set(hiddenSeriesIds),
    [hiddenSeriesIds]
  );
  const legendInteractive = props.legend?.interactive ?? false;
  const legendInteractionMode = props.legend?.interactionMode ?? 'focus';

  React.useEffect(() => {
    const knownSeriesIds = new Set(props.series.map((series) => series.id));
    setHiddenSeriesIds((prev) =>
      prev.filter((seriesId) => knownSeriesIds.has(seriesId))
    );
    setFocusedSeriesId((prev) => (prev && !knownSeriesIds.has(prev) ? null : prev));
  }, [props.series]);

  const visibleSeries = React.useMemo(
    () => props.series.filter((series) => !hiddenSeriesIdSet.has(series.id)),
    [props.series, hiddenSeriesIdSet]
  );
  const seriesForPlan = visibleSeries.length > 0 ? visibleSeries : props.series;

  const legendLayout = React.useMemo<LegendLayoutResult>(() => {
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

    const items: CoreLegendItem[] = sourceItems.map((item, index) => ({
      id: item.id,
      label: item.label ?? item.id,
      color: resolveLegendColor(index, item.color),
    }));

    return computeLegendLayout({
      chartWidth: props.width,
      items,
      measureText: props.fonts.measureText,
      font: props.fonts.yTickFont,
      show: props.legend?.show,
      position: props.legend?.position,
    });
  }, [props.legend, props.series, props.fonts, props.width, theme.series.palette]);

  /**
   * Resolve one deterministic default color per source series id.
   *
   * Why this map exists:
   * - Single-series renderers mount independently; without a shared mapping,
   *   each renderer falls back to palette slot 0 in multi-series charts.
   * - Centralizing this keeps legend swatches, rendered marks, and interaction
   *   overlays visually consistent.
   */
  const seriesColorById = React.useMemo(() => {
    const fallbackLegendColor = '#2563EB';
    const legendColorById = new Map(
      legendLayout.items.map((item) => [item.id, item.color] as const)
    );
    const byId = new Map<string, string>();

    props.series.forEach((series, index) => {
      byId.set(
        series.id,
        legendColorById.get(series.id) ??
          theme.series.palette[index % theme.series.palette.length] ??
          fallbackLegendColor
      );
    });

    return byId;
  }, [props.series, legendLayout.items, theme.series.palette]);

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

  const resolveSeriesEmphasis = React.useCallback(
    (seriesId: string) => {
      if (hiddenSeriesIdSet.has(seriesId)) {
        return {
          opacity: theme.state.muted.seriesOpacity,
          strokeWidthMultiplier: theme.state.muted.strokeWidthMultiplier,
          markerSizeMultiplier: theme.state.muted.markerSizeMultiplier,
        };
      }

      if (
        legendInteractive &&
        legendInteractionMode === 'focus' &&
        focusedSeriesId
      ) {
        if (focusedSeriesId === seriesId) {
          return {
            opacity: theme.state.focus.seriesOpacity,
            strokeWidthMultiplier: theme.state.focus.strokeWidthMultiplier,
            markerSizeMultiplier: theme.state.focus.markerSizeMultiplier,
          };
        }

        return {
          opacity: theme.state.muted.seriesOpacity,
          strokeWidthMultiplier: theme.state.muted.strokeWidthMultiplier,
          markerSizeMultiplier: theme.state.muted.markerSizeMultiplier,
        };
      }

      return {
        opacity: 1,
        strokeWidthMultiplier: 1,
        markerSizeMultiplier: 1,
      };
    },
    [
      hiddenSeriesIdSet,
      theme.state,
      legendInteractive,
      legendInteractionMode,
      focusedSeriesId,
    ]
  );

  const ctxValue = React.useMemo(
    () => ({
      layout: plan.layout,
      theme,
      fonts: props.fonts,
      hiddenSeriesIds: hiddenSeriesIdSet,
      focusedSeriesId,
      legendInteractionMode,
      seriesColorById,
      resolveSeriesEmphasis,
      scales: plan.scales,
    }),
    [
      plan.layout,
      plan.scales,
      theme,
      props.fonts,
      hiddenSeriesIdSet,
      focusedSeriesId,
      legendInteractionMode,
      seriesColorById,
      resolveSeriesEmphasis,
    ]
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

  const annotationMarkers = React.useMemo(() => {
    const markers = props.annotations?.markers ?? [];
    if (markers.length === 0) return [];

    return markers
      .map((marker, index) => {
        const x = plan.scales.x(marker.x as any);
        const y = plan.scales.y(marker.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        if (!isPointInRect(x, y, plan.layout.plot)) return null;

        return {
          id: marker.id ?? `annotation-marker-${index}`,
          x,
          y,
          label: marker.label,
          color: marker.color ?? "#DC2626",
          size: Number.isFinite(marker.size) ? Math.max(4, marker.size ?? 8) : 8,
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null);
  }, [props.annotations?.markers, plan.scales, plan.layout.plot]);

  const interactiveSeriesPoints = React.useMemo(() => {
    const fallbackColor = '#2563EB';
    const points: InteractivePoint[] = [];
    const sourceSeriesIndexById = new Map(
      props.series.map((series, index) => [series.id, index] as const)
    );

    seriesForPlan.forEach((series, seriesIndex) => {
      const sourceIndex =
        sourceSeriesIndexById.get(series.id) ?? seriesIndex;
      const color =
        seriesColorById.get(series.id) ??
        theme.series.palette[sourceIndex % theme.series.palette.length] ??
        fallbackColor;
      series.data.forEach((datum, datumIndex) => {
        const px = plan.scales.x(datum.x as any);
        const py = plan.scales.y(datum.y);
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;
        if (!isPointInRect(px, py, plan.layout.plot)) return;

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
    seriesColorById,
    theme.series.palette,
  ]);

  const indexedXAnchors = React.useMemo(() => {
    const anchors = new Set<number>();
    for (const point of interactiveSeriesPoints) anchors.add(point.x);
    return Array.from(anchors).sort((a, b) => a - b);
  }, [interactiveSeriesPoints]);

  /**
   * Pre-group interaction points by exact projected x-anchor.
   *
   * Why this is precomputed:
   * - Index snap mode runs on every gesture move.
   * - Building grouped arrays once avoids per-frame allocations from repeatedly
   *   filtering the full point list during scrubbing.
   */
  const pointsByAnchorX = React.useMemo(() => {
    const grouped = new Map<number, InteractivePoint[]>();
    for (const point of interactiveSeriesPoints) {
      const existing = grouped.get(point.x);
      if (existing) existing.push(point);
      else grouped.set(point.x, [point]);
    }
    for (const pointsAtAnchor of grouped.values()) {
      pointsAtAnchor.sort((a, b) => a.seriesIndex - b.seriesIndex);
    }
    return grouped;
  }, [interactiveSeriesPoints]);

  const scatterIndex = React.useMemo(
    () => buildScatterSpatialIndex(interactiveSeriesPoints, 44),
    [interactiveSeriesPoints]
  );

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

      if (legendInteractionMode === 'focus') {
        setHiddenSeriesIds((prev) => (prev.length === 0 ? prev : []));
        setFocusedSeriesId((prev) => (prev === seriesId ? null : seriesId));
        return;
      }

      setFocusedSeriesId(null);

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
      if (!isPointInRect(x, y, plan.layout.plot)) {
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
        const targetX = findNearestNumericValue(indexedXAnchors, x);
        if (!Number.isFinite(targetX)) {
          setInteractionState(null);
          return;
        }

        const grouped = pointsByAnchorX.get(targetX);
        if (!grouped || grouped.length === 0) {
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

      const nearest =
        findNearestPointInScatterIndex(scatterIndex, x, y) ??
        findNearestPoint(interactiveSeriesPoints, x, y);
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
      pointsByAnchorX,
      scatterIndex,
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

        {theme.grid.strokeWidth > 0
          ? renderPlotGrid({
              layout: plan.layout,
              xTicks: plan.ticks.x,
              yTicks: plan.ticks.y,
              stroke: theme.grid.stroke,
              strokeWidth: theme.grid.strokeWidth,
            })
          : null}

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
          {annotationMarkers.length > 0
            ? renderAnnotationMarkers({
                markers: annotationMarkers,
                font: skiaFonts.yTick,
                fontSize: props.fonts.yTickFont.size,
              })
            : null}
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
              focusedSeriesId,
              legendInteractionMode,
              theme,
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
    state: {
      ...baseTheme.state,
      ...(override.state ?? {}),
      focus: { ...baseTheme.state.focus, ...(override.state?.focus ?? {}) },
      muted: { ...baseTheme.state.muted, ...(override.state?.muted ?? {}) },
    },
  };
}

const AXIS_TICK_SIZE_PX = 4;
const AXIS_LABEL_GAP_PX = 6;

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

/**
 * Draw low-emphasis gridlines from resolved chart ticks.
 *
 * Why this helper exists:
 * - `theme.grid` is part of the public theme contract and should visibly
 *   affect renderer output.
 * - Rendering directly from final tick geometry keeps scaffolding deterministic
 *   and aligned with core collision/tick decisions.
 */
function renderPlotGrid(input: {
  layout: ReturnType<typeof buildTimeSeriesPlan>['layout'];
  xTicks: ReturnType<typeof buildTimeSeriesPlan>['ticks']['x'];
  yTicks: ReturnType<typeof buildTimeSeriesPlan>['ticks']['y'];
  stroke: string;
  strokeWidth: number;
}) {
  const plotRight = input.layout.plot.x + input.layout.plot.width;
  const plotBottom = input.layout.plot.y + input.layout.plot.height;

  return (
    <Group>
      {input.yTicks.map((tick, index) =>
        Number.isFinite(tick.y) ? (
          <Line
            key={`grid-y-${index}-${tick.value}`}
            p1={{ x: input.layout.plot.x, y: tick.y }}
            p2={{ x: plotRight, y: tick.y }}
            color={input.stroke}
            strokeWidth={input.strokeWidth}
          />
        ) : null
      )}
      {input.xTicks.map((tick, index) =>
        Number.isFinite(tick.x) ? (
          <Line
            key={`grid-x-${index}-${String(tick.value)}`}
            p1={{ x: tick.x, y: input.layout.plot.y }}
            p2={{ x: tick.x, y: plotBottom }}
            color={input.stroke}
            strokeWidth={input.strokeWidth}
          />
        ) : null
      )}
    </Group>
  );
}

function renderLegend(input: {
  chartWidth: number;
  chartHeight: number;
  layout: ReturnType<typeof buildTimeSeriesPlan>['layout'];
  legend: LegendLayoutResult;
  font: ReturnType<typeof matchFont>;
  fontSize: number;
  textColor: string;
  hiddenSeriesIds: Set<string>;
  focusedSeriesId: string | null;
  legendInteractionMode: LegendInteractionMode;
  theme: SaneChartTheme;
  interactive: boolean;
}) {
  const itemBoxes = computeLegendItemBoxes({
    chartWidth: input.chartWidth,
    chartHeight: input.chartHeight,
    layout: input.layout,
    legend: input.legend,
  });

  return (
    <Group>
      {input.legend.items.map((item, index) => {
        const box = itemBoxes[index];
        if (!box) return null;
        const hidden = input.hiddenSeriesIds.has(item.id);
        const isFocused =
          input.legendInteractionMode === 'focus' &&
          input.focusedSeriesId === item.id;
        const isMutedByFocus =
          input.legendInteractionMode === 'focus' &&
          !!input.focusedSeriesId &&
          input.focusedSeriesId !== item.id;
        const opacity = hidden
          ? input.theme.state.muted.legendOpacity
          : isMutedByFocus
            ? input.theme.state.muted.legendOpacity
            : isFocused
              ? input.theme.state.focus.legendOpacity
              : 1;
        const swatchY =
          box.y + Math.max(0, (box.height - input.legend.metrics.swatchSizePx) / 2);
        const textX =
          box.x +
          input.legend.metrics.swatchSizePx +
          input.legend.metrics.swatchTextGapPx;
        const textY = box.y + baselineOffsetFromTop(input.fontSize);
        return (
          <Group key={`legend-${item.id}-${index}`}>
            <SkRect
              x={box.x}
              y={swatchY}
              width={input.legend.metrics.swatchSizePx}
              height={input.legend.metrics.swatchSizePx}
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
                strokeWidth={isFocused ? 1 : hidden ? 0.75 : 0.5}
              />
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
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

function renderAnnotationMarkers(input: {
  markers: Array<{
    id: string;
    x: number;
    y: number;
    label?: string;
    color: string;
    size: number;
  }>;
  font: ReturnType<typeof matchFont>;
  fontSize: number;
}) {
  return (
    <Group>
      {input.markers.map((marker) => {
        const half = marker.size / 2;
        const labelX = marker.x + marker.size + 4;
        const labelY = marker.y - 4 + baselineOffsetFromTop(input.fontSize);
        return (
          <Group key={marker.id}>
            <Line
              p1={{ x: marker.x - half, y: marker.y }}
              p2={{ x: marker.x + half, y: marker.y }}
              color={marker.color}
              strokeWidth={1.6}
            />
            <Line
              p1={{ x: marker.x, y: marker.y - half }}
              p2={{ x: marker.x, y: marker.y + half }}
              color={marker.color}
              strokeWidth={1.6}
            />
            {marker.label ? (
              <Text
                text={marker.label}
                font={input.font}
                x={labelX}
                y={labelY}
                color={marker.color}
              />
            ) : null}
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
