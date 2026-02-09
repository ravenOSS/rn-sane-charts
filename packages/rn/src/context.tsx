import React from 'react';
import type { LayoutResult } from '@rn-sane-charts/core';
import type { SaneChartFonts, SaneChartTheme } from './types';

export type ChartContextValue = {
  layout: LayoutResult;
  theme: SaneChartTheme;
  fonts: SaneChartFonts;
  hiddenSeriesIds: Set<string>;
  scales: {
    x: (v: any) => number;
    y: (v: number) => number;
  };
};

export const ChartContext = React.createContext<ChartContextValue | null>(null);

export function useChartContext(): ChartContextValue {
  const ctx = React.useContext(ChartContext);
  if (!ctx) {
    throw new Error('rn-sane-charts: <Series> must be used inside <Chart>.');
  }
  return ctx;
}
