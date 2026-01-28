import React from "react";
import { View } from "react-native";
import { Canvas, Group, Rect as SkRect } from "@shopify/react-native-skia";

import type { Series } from "@rn-sane-charts/core";
import { buildTimeSeriesPlan } from "@rn-sane-charts/core";
import type { SaneChartFonts, SaneChartTheme } from "./types";
import { defaultTheme } from "./theme/defaultTheme";
import { ChartContext } from "./context";

export type ChartProps = {
  width: number;
  height: number;

  series: Series[];

  title?: string;
  subtitle?: string;

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
  const theme: SaneChartTheme = {
    ...defaultTheme,
    ...props.theme,
    axis: { ...defaultTheme.axis, ...(props.theme?.axis ?? {}) },
    grid: { ...defaultTheme.grid, ...(props.theme?.grid ?? {}) },
    series: { ...defaultTheme.series, ...(props.theme?.series ?? {}) },
  };

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
          tickFont: props.fonts.xTickFont,
        },
        yAxis: {
          show: true,
          tickFont: props.fonts.yTickFont,
        },
        measureText: props.fonts.measureText,
      },
      yIncludeZero: false,
    });
  }, [props.series, props.width, props.height, props.title, props.subtitle, props.fonts]);

  const ctxValue = React.useMemo(
    () => ({
      layout: plan.layout,
      theme,
      fonts: props.fonts,
      scales: plan.scales,
    }),
    [plan.layout, plan.scales, theme, props.fonts]
  );

  return (
    <View style={{ width: props.width, height: props.height }}>
      <Canvas style={{ width: props.width, height: props.height }}>
        {/* Background */}
        <SkRect x={0} y={0} width={props.width} height={props.height} color={theme.background} />

        {/* Clip series rendering to plot bounds */}
        <Group
          clip={{
            x: plan.layout.plot.x,
            y: plan.layout.plot.y,
            width: plan.layout.plot.width,
            height: plan.layout.plot.height,
          }}
        >
          <ChartContext.Provider value={ctxValue}>{props.children}</ChartContext.Provider>
        </Group>

        {/* TODO (next): Axes + ticks + labels in non-clipped layer */}
      </Canvas>
    </View>
  );
}
