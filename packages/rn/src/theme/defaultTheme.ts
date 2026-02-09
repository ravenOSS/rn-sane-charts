import type { SaneChartTheme } from '../types';

export const defaultTheme: SaneChartTheme = {
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
