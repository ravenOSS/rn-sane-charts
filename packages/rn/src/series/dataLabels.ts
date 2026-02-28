import type { Datum, FontSpec, MeasureTextFn } from '@rn-sane-charts/core';

export type BarDataLabelPosition = 'outside' | 'inside' | 'none';

export type BarDataLabelsConfig = {
  position?: BarDataLabelPosition;
  color?: string;
  formatter?: (value: number, datum: Datum, seriesId: string) => string;
  minFontSize?: number;
  maxFontSize?: number;
  padding?: number;
};

export type ResolvedBarDataLabel = {
  text: string;
  x: number;
  baselineY: number;
  font: FontSpec;
  color: string;
};

export type RNFontStyle = {
  fontFamily?: string;
  fontSize: number;
  fontStyle?: 'normal' | 'italic';
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
};

/**
 * Resolve one data label for a vertical bar geometry.
 *
 * Strategy:
 * - Compute label text from formatter/default number formatting.
 * - Auto-fit text size from max -> min until it fits bar constraints.
 * - Place text either inside near top, or outside away from the baseline.
 *
 * Why this helper exists:
 * - Keeps bar renderers focused on geometry and paint operations.
 * - Centralizes fitting heuristics so single/grouped/stacked bars behave
 *   consistently under dense layouts.
 */
export function resolveVerticalBarDataLabel(input: {
  dataLabels?: BarDataLabelsConfig;
  value: number;
  datum: Datum;
  seriesId: string;
  rect: { x: number; y: number; width: number; height: number };
  outsideDirection: 'up' | 'down';
  fillColor: string;
  defaultTextColor: string;
  plot: { x: number; y: number; width: number; height: number };
  measureText: MeasureTextFn;
  baseFont: FontSpec;
}): ResolvedBarDataLabel | null {
  const config = input.dataLabels;
  const position = config?.position ?? 'none';
  if (position === 'none') return null;

  const text = formatLabelText(input.value, input.datum, input.seriesId, config);
  if (!text) return null;

  const padding = clampFinite(config?.padding, 2, 0, 12);
  const minFontSize = clampFinite(config?.minFontSize, 6, 6, 24);
  const defaultMax = Math.max(input.baseFont.size, 12);
  const maxFontSize = clampFinite(config?.maxFontSize, defaultMax, minFontSize, 32);

  const maxWidth =
    position === 'outside'
      ? Number.POSITIVE_INFINITY
      : input.rect.width - padding * 2;
  if (maxWidth <= 2) return null;

  const maxHeight =
    position === 'inside'
      ? Math.max(0, input.rect.height - padding * 2)
      : Number.POSITIVE_INFINITY;
  if (position === 'inside' && maxHeight <= 4) return null;

  const chosen = chooseAutoFontSpec({
    text,
    minFontSize,
    maxFontSize,
    maxWidth,
    maxHeight,
    baseFont: input.baseFont,
    measureText: input.measureText,
  });
  if (!chosen && input.rect.height < minFontSize + padding) return null;
  const resolved =
    chosen ??
    (() => {
      const fallbackFont: FontSpec = { ...input.baseFont, size: minFontSize };
      const measured = input.measureText({
        text,
        font: fallbackFont,
        angle: 0,
      });
      return { font: fallbackFont, width: measured.width, height: measured.height };
    })();

  const baselineOffset = baselineOffsetFromTop(resolved.font.size);
  const plotRight = input.plot.x + input.plot.width;
  const plotBottom = input.plot.y + input.plot.height;
  const centerX = input.rect.x + input.rect.width / 2;
  const x = clamp(
    centerX - resolved.width / 2,
    input.plot.x,
    plotRight - resolved.width
  );

  let topY = input.rect.y + padding;
  if (position === 'outside') {
    const gap = 2;
    if (input.outsideDirection === 'up') {
      topY = input.rect.y - resolved.height - gap;
    } else {
      topY = input.rect.y + input.rect.height + gap;
    }
  }

  // If outside labels are clipped, gracefully degrade to an inside-top label
  // instead of dropping all labels on short headroom charts.
  if (
    position === 'outside' &&
    (topY < input.plot.y || topY + resolved.height > plotBottom)
  ) {
    topY = input.rect.y + padding;
  }

  const baselineY = topY + baselineOffset;
  if (topY < input.plot.y || topY + resolved.height > plotBottom) return null;

  return {
    text,
    x,
    baselineY,
    font: resolved.font,
    color:
      config?.color ??
      (position === 'inside'
        ? resolveContrastingTextColor(input.fillColor, input.defaultTextColor)
        : input.defaultTextColor),
  };
}

function chooseAutoFontSpec(input: {
  text: string;
  minFontSize: number;
  maxFontSize: number;
  maxWidth: number;
  maxHeight: number;
  baseFont: FontSpec;
  measureText: MeasureTextFn;
}): { font: FontSpec; width: number; height: number } | null {
  for (
    let candidate = Math.floor(input.maxFontSize);
    candidate >= Math.ceil(input.minFontSize);
    candidate -= 1
  ) {
    const font: FontSpec = { ...input.baseFont, size: candidate };
    const measured = input.measureText({
      text: input.text,
      font,
      angle: 0,
    });

    if (
      measured.width <= input.maxWidth &&
      measured.height <= input.maxHeight
    ) {
      return { font, width: measured.width, height: measured.height };
    }
  }
  return null;
}

export function toRNFontStyle(font: FontSpec): RNFontStyle {
  return {
    fontFamily: font.family,
    fontSize: font.size,
    fontStyle: font.style,
    fontWeight: normalizeFontWeight(font.weight),
  };
}

function formatLabelText(
  value: number,
  datum: Datum,
  seriesId: string,
  config?: BarDataLabelsConfig
): string {
  if (config?.formatter) return config.formatter(value, datum, seriesId);
  if (Math.abs(value) >= 1000) return value.toLocaleString();
  return Number(value.toFixed(2)).toString();
}

function resolveContrastingTextColor(
  background: string,
  fallback: string
): string {
  const rgb = parseHexColor(background);
  if (!rgb) return fallback;

  // WCAG-inspired luminance threshold for dark/light text switching.
  const luminance =
    (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.6 ? '#111827' : '#F9FAFB';
}

function parseHexColor(value: string): { r: number; g: number; b: number } | null {
  const trimmed = value.trim();
  const shortHex = /^#([0-9a-fA-F]{3})$/;
  const longHex = /^#([0-9a-fA-F]{6})$/;

  const shortMatch = trimmed.match(shortHex);
  if (shortMatch?.[1]) {
    const [r, g, b] = shortMatch[1].split('');
    if (!r || !g || !b) return null;
    return {
      r: parseInt(`${r}${r}`, 16),
      g: parseInt(`${g}${g}`, 16),
      b: parseInt(`${b}${b}`, 16),
    };
  }

  const longMatch = trimmed.match(longHex);
  if (longMatch?.[1]) {
    return {
      r: parseInt(longMatch[1].slice(0, 2), 16),
      g: parseInt(longMatch[1].slice(2, 4), 16),
      b: parseInt(longMatch[1].slice(4, 6), 16),
    };
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampFinite(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
) {
  if (!Number.isFinite(value)) return fallback;
  return clamp(value as number, min, max);
}

function normalizeFontWeight(
  weight: FontSpec['weight']
): RNFontStyle['fontWeight'] {
  if (typeof weight === 'number') {
    const normalized = clamp(Math.round(weight / 100) * 100, 100, 900);
    return `${normalized}` as RNFontStyle['fontWeight'];
  }
  if (weight === 'bold' || weight === 'normal') return weight;
  if (weight === 'medium') return '500';
  if (weight === 'semibold') return '600';
  return undefined;
}

/**
 * Conservative ascent estimate when font metrics are not available.
 */
function baselineOffsetFromTop(fontSize: number) {
  return Math.round(fontSize * 0.8);
}
