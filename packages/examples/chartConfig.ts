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
    pageStart: '#F4F8FF',
    pageEnd: '#FFF8F1',
    shell: '#FFFFFFE8',
    shellBorder: 'rgba(15,23,42,0.10)',
    heading: '#0F172A',
    body: '#334155',
    chipBg: '#FFFFFF',
    chipBorder: 'rgba(15,23,42,0.14)',
    chipText: '#334155',
    chipActiveBg: '#0EA5E9',
    chipActiveText: '#FFFFFF',
    accent: '#0EA5E9',
    perfPanel: '#F8FAFF',
  },
  dark: {
    pageStart: '#030712',
    pageEnd: '#0B1220',
    shell: '#0F172AD6',
    shellBorder: 'rgba(148,163,184,0.30)',
    heading: '#F8FAFC',
    body: '#CBD5E1',
    chipBg: 'rgba(15,23,42,0.74)',
    chipBorder: 'rgba(148,163,184,0.34)',
    chipText: '#CBD5E1',
    chipActiveBg: '#22D3EE',
    chipActiveText: '#082F49',
    accent: '#22D3EE',
    perfPanel: '#111827',
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
      frame: { strokeWidth: 1, stroke: 'rgba(148,163,184,0.34)' },
      grid: { strokeWidth: 1, stroke: 'rgba(148,163,184,0.22)' },
      axis: {
        tick: { color: 'rgba(241,245,249,0.94)' },
        line: { stroke: 'rgba(148,163,184,0.72)', strokeWidth: 1.05 },
      },
      series: {
        // Keep palette order aligned with Revenue -> Forecast -> Target mapping.
        palette: ['#38BDF8', '#FB923C', '#34D399', '#A78BFA', '#FB7185', '#22D3EE'],
        strokeWidth: 2.4,
      },
      state: {
        focus: {
          seriesOpacity: 1,
          strokeWidthMultiplier: 1.2,
          markerSizeMultiplier: 1.14,
          legendOpacity: 1,
        },
        muted: {
          seriesOpacity: 0.28,
          strokeWidthMultiplier: 0.92,
          markerSizeMultiplier: 0.92,
          legendOpacity: 0.5,
        },
      },
    };
  }

  return {
    frame: { strokeWidth: 1, stroke: 'rgba(15,23,42,0.16)' },
    grid: { strokeWidth: 1, stroke: 'rgba(15,23,42,0.12)' },
    axis: {
      tick: { color: 'rgba(15,23,42,0.86)' },
      line: { stroke: 'rgba(15,23,42,0.42)', strokeWidth: 1 },
    },
    series: {
      // Keep palette order aligned with Revenue -> Forecast -> Target mapping.
      palette: ['#0EA5E9', '#F97316', '#10B981', '#6366F1', '#F43F5E', '#14B8A6'],
      strokeWidth: 2.3,
    },
    state: {
      focus: {
        seriesOpacity: 1,
        strokeWidthMultiplier: 1.18,
        markerSizeMultiplier: 1.14,
        legendOpacity: 1,
      },
      muted: {
        seriesOpacity: 0.22,
        strokeWidthMultiplier: 0.9,
        markerSizeMultiplier: 0.9,
        legendOpacity: 0.46,
      },
    },
  };
}

/**
 * Keep series colors centralized so multi-line charts stay consistent.
 */
export const exampleSeriesColors = {
  revenue: '#0EA5E9',
  forecast: '#F97316',
  target: '#10B981',
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
    fillOpacity: 0.2,
    strokeWidth: 2.2,
    colors: [
      exampleSeriesColors.revenue,
      exampleSeriesColors.forecast,
      exampleSeriesColors.target,
    ],
    baselineY: 0,
  },
  bar: {
    color: '#0EA5E9',
  },
  groupedBar: {
    colors: [
      exampleSeriesColors.revenue,
      exampleSeriesColors.forecast,
      exampleSeriesColors.target,
    ],
  },
  stackedBar: {
    colors: ['#0EA5E9', '#10B981', '#F97316'],
  },
  scatter: {
    color: '#0EA5E9',
  },
  histogram: {
    bins: 12,
    color: '#0EA5E9',
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
    xTickFont: { size: 12, family: input.fontFamily },
    yTickFont: { size: 12, family: input.fontFamily },
    titleFont: { size: 17, family: input.fontFamily, weight: 'semibold' },
    subtitleFont: { size: 12, family: input.fontFamily },
    xAxisTitleFont: { size: 12, family: input.fontFamily, weight: 'medium' },
    yAxisTitleFont: { size: 12, family: input.fontFamily, weight: 'medium' },
  };
}
