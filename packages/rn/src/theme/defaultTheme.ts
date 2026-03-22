import type { SaneChartTheme } from '../types';

/**
 * Apple-native–inspired chart presets (light / dark).
 *
 * Rationale:
 * - Surfaces align with iOS **system grouped backgrounds** and **elevated**
 *   materials (`#F2F2F7` light, `#1C1C1E` dark chart fill) rather than generic
 *   slate/blue-gray web palettes.
 * - Chrome uses **label / separator opacities** on `rgb(60,60,67)` (light) and
 *   `rgb(235,235,245)` (dark), similar to SF-style secondary labels and
 *   hairlines—not Tailwind slate.
 * - Series colors follow **system accent hues** (blue, green, orange, red,
 *   purple, amber) at moderate saturation so charts stay readable and calm on
 *   mobile, matching the examples app’s DESIGN_GUIDE direction.
 *
 * Consumers can still override any token via `theme` on `Chart`.
 */

/** Primary fallback when no palette slot applies (aligned with `palette[0]`). */
export const DEFAULT_SERIES_ACCENT = '#3A8DDE';

/**
 * Light preset: grouped background, quiet grid, SF-like axis labels.
 */
export const lightTheme: SaneChartTheme = {
  background: '#F2F2F7',
  frame: { stroke: 'rgba(60,60,67,0.12)', strokeWidth: 1 },
  grid: { stroke: 'rgba(60,60,67,0.08)', strokeWidth: 1 },
  axis: {
    tick: { color: 'rgba(60,60,67,0.88)' },
    line: { stroke: 'rgba(60,60,67,0.29)', strokeWidth: 1 },
  },
  series: {
    palette: [
      '#3A8DDE',
      '#34B15C',
      '#E6863A',
      '#E05252',
      '#9B7ED9',
      '#D9A83A',
    ],
    strokeWidth: 2.2,
  },
  state: {
    focus: {
      seriesOpacity: 1,
      strokeWidthMultiplier: 1.12,
      markerSizeMultiplier: 1.1,
      legendOpacity: 1,
    },
    muted: {
      seriesOpacity: 0.22,
      strokeWidthMultiplier: 0.9,
      markerSizeMultiplier: 0.9,
      legendOpacity: 0.42,
    },
  },
};

/**
 * Dark preset: elevated surface (not pure black), softer grid, readable labels.
 */
export const darkTheme: SaneChartTheme = {
  background: '#1C1C1E',
  frame: { stroke: 'rgba(235,235,245,0.14)', strokeWidth: 1 },
  grid: { stroke: 'rgba(235,235,245,0.10)', strokeWidth: 1 },
  axis: {
    tick: { color: 'rgba(235,235,245,0.90)' },
    line: { stroke: 'rgba(235,235,245,0.32)', strokeWidth: 1 },
  },
  series: {
    palette: [
      '#5AC8FA',
      '#32D74B',
      '#FF9F0A',
      '#FF453A',
      '#BF5AF2',
      '#FFD60A',
    ],
    strokeWidth: 2.4,
  },
  state: {
    focus: {
      seriesOpacity: 1,
      strokeWidthMultiplier: 1.15,
      markerSizeMultiplier: 1.12,
      legendOpacity: 1,
    },
    muted: {
      seriesOpacity: 0.26,
      strokeWidthMultiplier: 0.92,
      markerSizeMultiplier: 0.92,
      legendOpacity: 0.48,
    },
  },
};

/**
 * Backward-compatible alias for existing imports.
 */
export const defaultTheme = lightTheme;
