import type { FontSpec, MeasureTextFn } from '@rn-sane-charts/core';

export type ChartColorScheme = 'light' | 'dark' | 'system';

export type ChartInteraction = {
  enabled?: boolean;
  crosshair?: 'none' | 'x' | 'xy';
  snap?: 'nearest' | 'index';
  tooltip?: boolean;
};

export type LegendInteractionMode = 'focus' | 'toggle' | 'isolate';

export type SaneChartTheme = {
  background: string;
  frame: { stroke: string; strokeWidth: number };
  grid: { stroke: string; strokeWidth: number };
  axis: {
    tick: { color: string };
    line: { stroke: string; strokeWidth: number };
  };
  series: {
    palette: string[];
    strokeWidth: number;
  };
  state: {
    focus: {
      seriesOpacity: number;
      strokeWidthMultiplier: number;
      markerSizeMultiplier: number;
      legendOpacity: number;
    };
    muted: {
      seriesOpacity: number;
      strokeWidthMultiplier: number;
      markerSizeMultiplier: number;
      legendOpacity: number;
    };
  };
};

export type SaneChartFonts = {
  /**
   * Renderer-bound text measurement function.
   *
   * Core expects this to return the AABB width/height AFTER rotation.
   */
  measureText: MeasureTextFn;

  /**
   * Fonts used by core layout.
   * If these diverge from what the renderer uses, axis collisions and margins
   * will be wrong (clipped/overlapping labels).
   */
  xTickFont: FontSpec;
  yTickFont: FontSpec;
  titleFont: FontSpec;
  subtitleFont: FontSpec;

  /**
   * Optional axis title fonts.
   *
   * If omitted, Chart falls back to `subtitleFont` so callers can adopt
   * axis titles without adding more required font config.
   */
  xAxisTitleFont?: FontSpec;
  yAxisTitleFont?: FontSpec;
};
