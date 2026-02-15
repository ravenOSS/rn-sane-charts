import React from "react";
import { Path, Skia } from "@shopify/react-native-skia";
import type { Series } from "@rn-sane-charts/core";
import {
  buildLinePath,
  buildStackedAreaPath,
  stackSeries,
} from "@rn-sane-charts/core";
import { useChartContext } from "../context";

export type StackedAreaSeriesProps = {
  series: Series[];
  colors?: readonly string[];
  fillOpacity?: number;
  strokeWidth?: number;
};

/**
 * Draw stacked area layers from aligned multi-series data.
 *
 * Why this component exists:
 * - Completes the MVP "area (including stacked)" feature.
 * - Reuses core stacking + geometry helpers so renderer logic stays thin and
 *   deterministic.
 */
export function StackedAreaSeries(props: StackedAreaSeriesProps) {
  const { scales, theme, hiddenSeriesIds } = useChartContext();
  const fillOpacity = clampOpacity(props.fillOpacity ?? 0.24);
  const strokeWidth = Math.max(0, props.strokeWidth ?? 1.6);

  const visibleSeries = React.useMemo(
    () =>
      props.series
        .map((series, sourceIndex) => ({ series, sourceIndex }))
        .filter((entry) => !hiddenSeriesIds.has(entry.series.id)),
    [props.series, hiddenSeriesIds]
  );

  const stacked = React.useMemo(
    () => stackSeries(visibleSeries.map((entry) => entry.series)),
    [visibleSeries]
  );

  const layers = React.useMemo(
    () =>
      stacked.map((layer, visibleIndex) => {
        const fillPath = buildStackedAreaPath(layer, scales).d;
        const topLinePath = buildLinePath(
          {
            id: `${layer.id}-top-line`,
            data: layer.data.map((point) => ({ x: point.x, y: point.y1 })),
          },
          scales
        ).d;

        const fillSkPath = fillPath ? Skia.Path.MakeFromSVGString(fillPath) : null;
        const lineSkPath = topLinePath
          ? Skia.Path.MakeFromSVGString(topLinePath)
          : null;
        const sourceIndex = visibleSeries[visibleIndex]?.sourceIndex ?? visibleIndex;
        const color =
          props.colors?.[sourceIndex] ??
          theme.series.palette[sourceIndex % theme.series.palette.length];

        return {
          id: layer.id,
          color,
          fillSkPath,
          lineSkPath,
        };
      }),
    [stacked, scales, visibleSeries, props.colors, theme.series.palette]
  );

  return (
    <>
      {layers.map((layer, index) => {
        if (!layer.fillSkPath) return null;
        return (
          <Path
            key={`stacked-area-fill-${layer.id}-${index}`}
            path={layer.fillSkPath}
            style="fill"
            color={layer.color}
            opacity={fillOpacity}
          />
        );
      })}
      {strokeWidth > 0
        ? layers.map((layer, index) => {
            if (!layer.lineSkPath) return null;
            return (
              <Path
                key={`stacked-area-line-${layer.id}-${index}`}
                path={layer.lineSkPath}
                style="stroke"
                color={layer.color}
                strokeWidth={strokeWidth}
              />
            );
          })
        : null}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}

