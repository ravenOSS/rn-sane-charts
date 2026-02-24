import type { MeasureTextFn } from '@rn-sane-charts/core';
import type { SaneChartFonts, SaneChartTheme } from '@rn-sane-charts/rn';

/**
 * Examples app surface tokens.
 *
 * Why this object exists:
 * - The gallery should feel like one deliberate product, not disconnected demos.
 * - Keeping app-shell colors centralized makes light/dark parity easy to tune.
 */
export const exampleSurfaceTokens = {
  light: {
    pageStart: '#F2F2F7',
    pageEnd: '#E5E5EA',
    shell: '#FFFFFFD9',
    shellBorder: 'rgba(60,60,67,0.20)',
    heading: '#1C1C1E',
    body: '#3A3A3C',
    chipBg: 'rgba(118,118,128,0.12)',
    chipBorder: 'rgba(60,60,67,0.16)',
    chipText: '#3A3A3C',
    chipActiveBg: '#3A8DDE',
    chipActiveText: '#FFFFFF',
    accent: '#3A8DDE',
    perfPanel: '#FFFFFF',
  },
  dark: {
    pageStart: '#000000',
    pageEnd: '#0B0B0F',
    shell: '#1C1C1ED6',
    shellBorder: 'rgba(255,255,255,0.20)',
    heading: '#F2F2F7',
    body: '#D1D1D6',
    chipBg: 'rgba(118,118,128,0.24)',
    chipBorder: 'rgba(255,255,255,0.20)',
    chipText: '#D1D1D6',
    chipActiveBg: '#3A8DDE',
    chipActiveText: '#FFFFFF',
    accent: '#3A8DDE',
    perfPanel: '#1C1C1E',
  },
} as const;

/**
 * Build an examples chart theme tuned for the active color scheme.
 *
 * Why this is dynamic:
 * - The examples app overlays its own visual language on top of library presets.
 * - A static light-oriented override made dark-mode labels and gridlines too dim.
 */
export function createExampleChartTheme(
  colorScheme: 'light' | 'dark'
): Partial<SaneChartTheme> {
  if (colorScheme === 'dark') {
    return {
      frame: { strokeWidth: 0, stroke: 'rgba(255,255,255,0)' },
      grid: { strokeWidth: 1, stroke: 'rgba(235,235,245,0.13)' },
      axis: {
        tick: { color: 'rgba(235,235,245,0.88)' },
        line: { stroke: 'rgba(235,235,245,0.34)', strokeWidth: 1 },
      },
      series: {
        // Keep palette order aligned with Revenue -> Forecast -> Target mapping.
        palette: ['#5CA8ED', '#E5AC63', '#61BE88', '#8C88E8', '#E07A96', '#7EC9E8'],
        strokeWidth: 2.3,
      },
      state: {
        focus: {
          seriesOpacity: 1,
          strokeWidthMultiplier: 1.14,
          markerSizeMultiplier: 1.1,
          legendOpacity: 1,
        },
        muted: {
          seriesOpacity: 0.3,
          strokeWidthMultiplier: 0.94,
          markerSizeMultiplier: 0.94,
          legendOpacity: 0.54,
        },
      },
    };
  }

  return {
    frame: { strokeWidth: 0, stroke: 'rgba(60,60,67,0)' },
    grid: { strokeWidth: 1, stroke: 'rgba(60,60,67,0.12)' },
    axis: {
      tick: { color: 'rgba(28,28,30,0.82)' },
      line: { stroke: 'rgba(60,60,67,0.34)', strokeWidth: 1 },
    },
    series: {
      // Keep palette order aligned with Revenue -> Forecast -> Target mapping.
      palette: ['#3A8DDE', '#D79A4A', '#53B67A', '#7D79DA', '#CF6B87', '#68B8DA'],
      strokeWidth: 2.2,
    },
    state: {
      focus: {
        seriesOpacity: 1,
        strokeWidthMultiplier: 1.14,
        markerSizeMultiplier: 1.1,
        legendOpacity: 1,
      },
      muted: {
        seriesOpacity: 0.24,
        strokeWidthMultiplier: 0.93,
        markerSizeMultiplier: 0.93,
        legendOpacity: 0.5,
      },
    },
  };
}

/**
 * Keep series colors centralized so multi-line charts stay consistent.
 */
export const exampleSeriesColors = {
  revenue: '#3A8DDE',
  forecast: '#D79A4A',
  target: '#53B67A',
} as const;

/**
 * Color-blind-friendly palette (Okabe-Ito inspired) used by the accessibility
 * verification view.
 */
export const accessibilityPalette = ['#0072B2', '#D55E00', '#009E73'] as const;

/**
 * Build a high-contrast accessibility check theme for the current color scheme.
 */
export function createAccessibilityTheme(
  colorScheme: 'light' | 'dark'
): Partial<SaneChartTheme> {
  if (colorScheme === 'dark') {
    return {
      background: '#050D1C',
      axis: {
        tick: { color: '#F8FAFC' },
        line: { stroke: '#94A3B8', strokeWidth: 1.15 },
      },
      grid: { stroke: 'rgba(148,163,184,0.34)', strokeWidth: 1 },
      series: {
        palette: ['#56B4E9', '#E69F00', '#009E73'],
        strokeWidth: 2.4,
      },
    };
  }

  return {
    background: '#FFFFFF',
    axis: {
      tick: { color: '#111827' },
      line: { stroke: '#4B5563', strokeWidth: 1.1 },
    },
    grid: { stroke: 'rgba(75,85,99,0.24)', strokeWidth: 1 },
    series: {
      palette: [...accessibilityPalette],
      strokeWidth: 2.2,
    },
  };
}

export const exampleChartTypeConfig = {
  line: {
    strokeWidth: 2.4,
    colors: [
      exampleSeriesColors.revenue,
      exampleSeriesColors.forecast,
      exampleSeriesColors.target,
    ],
  },
  area: {
    fillOpacity: 0.16,
    strokeWidth: 2.2,
    colors: [
      exampleSeriesColors.revenue,
      exampleSeriesColors.forecast,
      exampleSeriesColors.target,
    ],
    baselineY: 0,
  },
  bar: {
    color: '#3A8DDE',
  },
  groupedBar: {
    colors: [
      exampleSeriesColors.revenue,
      exampleSeriesColors.forecast,
      exampleSeriesColors.target,
    ],
  },
  stackedBar: {
    colors: ['#3A8DDE', '#53B67A', '#D79A4A'],
  },
  scatter: {
    color: '#3A8DDE',
  },
  histogram: {
    bins: 12,
    color: '#3A8DDE',
    barGapPx: 2,
  },
} as const;

/**
 * Build chart fonts from a shared family token + renderer measure function.
 */
export function createExampleChartFonts(input: {
  fontFamily: string;
  measureText: MeasureTextFn;
}): SaneChartFonts {
  return {
    measureText: input.measureText,
    xTickFont: { size: 13, family: input.fontFamily },
    yTickFont: { size: 13, family: input.fontFamily },
    titleFont: { size: 17, family: input.fontFamily, weight: 'semibold' },
    subtitleFont: { size: 13, family: input.fontFamily },
    xAxisTitleFont: { size: 13, family: input.fontFamily, weight: 'medium' },
    yAxisTitleFont: { size: 13, family: input.fontFamily, weight: 'medium' },
  };
}
