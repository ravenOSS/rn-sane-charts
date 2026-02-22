import type { SaneChartTheme } from '../types';

/**
 * Light preset used as the baseline chart look.
 */
export const lightTheme: SaneChartTheme = {
  background: '#F6F8FB',
  frame: { stroke: 'rgba(15,23,42,0.16)', strokeWidth: 1 },
  grid: { stroke: 'rgba(15,23,42,0.10)', strokeWidth: 1 },
  axis: {
    tick: { color: 'rgba(15,23,42,0.84)' },
    line: { stroke: 'rgba(15,23,42,0.36)', strokeWidth: 1 },
  },
  series: {
    palette: ['#2563EB', '#0D9488', '#16A34A', '#EA580C', '#4F46E5', '#DC2626'],
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
 * Dark preset tuned for contrast on non-black surfaces.
 */
export const darkTheme: SaneChartTheme = {
  background: '#0B1220',
  frame: { stroke: 'rgba(148,163,184,0.28)', strokeWidth: 1 },
  grid: { stroke: 'rgba(148,163,184,0.18)', strokeWidth: 1 },
  axis: {
    tick: { color: 'rgba(226,232,240,0.94)' },
    line: { stroke: 'rgba(148,163,184,0.62)', strokeWidth: 1 },
  },
  series: {
    palette: ['#60A5FA', '#2DD4BF', '#34D399', '#FB923C', '#A78BFA', '#F87171'],
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
