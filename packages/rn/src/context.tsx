import React from 'react';
import type { LayoutResult } from '@rn-sane-charts/core';
import type {
  LegendInteractionMode,
  SaneChartFonts,
  SaneChartTheme,
} from './types';

export type ChartContextValue = {
  layout: LayoutResult;
  theme: SaneChartTheme;
  fonts: SaneChartFonts;
  hiddenSeriesIds: Set<string>;
  focusedSeriesId: string | null;
  legendInteractionMode: LegendInteractionMode;
  seriesColorById: Map<string, string>;
  resolveSeriesEmphasis: (seriesId: string) => {
    opacity: number;
    strokeWidthMultiplier: number;
    markerSizeMultiplier: number;
  };
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
