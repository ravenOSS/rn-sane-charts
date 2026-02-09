import type { FontSpec, MeasureTextFn } from '@rn-sane-charts/core';

export type ChartColorScheme = 'light' | 'dark' | 'system';

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
