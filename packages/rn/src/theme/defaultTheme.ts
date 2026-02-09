import type { SaneChartTheme } from '../types';

/**
 * Light preset used as the baseline chart look.
 */
export const lightTheme: SaneChartTheme = {
  background: '#FFFFFF',
  frame: { stroke: 'rgba(0,0,0,0)', strokeWidth: 0 },
  grid: { stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1 },
  axis: {
    tick: { color: 'rgba(0,0,0,0.78)' },
    line: { stroke: 'rgba(0,0,0,0.30)', strokeWidth: 1 },
  },
  series: {
    palette: ['#2563EB', '#DC2626', '#16A34A', '#9333EA', '#EA580C'],
    strokeWidth: 2,
  },
};

/**
 * Dark preset tuned for contrast on non-black surfaces.
 */
export const darkTheme: SaneChartTheme = {
  background: '#111827',
  frame: { stroke: 'rgba(255,255,255,0)', strokeWidth: 0 },
  grid: { stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1 },
  axis: {
    tick: { color: 'rgba(255,255,255,0.90)' },
    line: { stroke: 'rgba(255,255,255,0.45)', strokeWidth: 1 },
  },
  series: {
    palette: ['#60A5FA', '#F87171', '#34D399', '#A78BFA', '#FB923C'],
    strokeWidth: 2.25,
  },
};

/**
 * Backward-compatible alias for existing imports.
 */
export const defaultTheme = lightTheme;
