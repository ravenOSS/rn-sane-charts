import { matchFont } from '@shopify/react-native-skia';
import type { SkFont } from '@shopify/react-native-skia';
import type {
  FontSpec,
  MeasureTextFn,
  TextMeasureInput,
  TextMeasureResult,
} from '@rn-sane-charts/core';

/**
 * Create a core-compatible `measureText` function using Skia text metrics.
 *
 * Core requirement:
 * - Return axis-aligned bounding box (AABB) width/height AFTER rotation.
 * - Respect the `FontSpec` provided on each `TextMeasureInput`.
 *
 * Why this adapter resolves fonts per call:
 * - Core layout can measure x ticks, y ticks, title, and subtitle with different
 *   font sizes/weights.
 * - If we always measured with one fixed SkFont, header centering and margin
 *   calculations drift from what is actually rendered.
 *
 * Performance:
 * - Font resolution uses a small cache keyed by normalized `FontSpec`, so
 *   repeated axis/tick measurements do not re-run `matchFont`.
 *
 * Rotation math:
 * - Compute rotated AABB dimensions from the unrotated width/height using trig.
 * - This is conservative (collision-safe) and fast.
 */
export function makeSkiaMeasureText(fallbackFont?: SkFont): MeasureTextFn {
  const fontCache = new Map<string, SkFont>();

  const resolveFont = (font: FontSpec): SkFont => {
    const key = fontCacheKey(font);
    const cached = fontCache.get(key);
    if (cached) return cached;

    const resolved =
      matchFont({
        fontFamily: font.family,
        fontSize: font.size,
        fontStyle: font.style,
        fontWeight: normalizeFontWeight(font.weight),
      }) ?? fallbackFont;

    if (!resolved) {
      // Last-resort fallback so we always return deterministic dimensions.
      const defaultFont = matchFont({ fontSize: font.size }) as SkFont;
      fontCache.set(key, defaultFont);
      return defaultFont;
    }

    fontCache.set(key, resolved);
    return resolved;
  };

  return (input: TextMeasureInput): TextMeasureResult => {
    const angleDeg = input.angle ?? 0;
    const skFont = resolveFont(input.font);

    // 1) Unrotated width
    const m = skFont.measureText(input.text);
    const w = m.width;

    // 2) Unrotated height from font metrics (ascent is typically negative)
    const metrics = skFont.getMetrics();
    const h = metrics.descent - metrics.ascent;

    // 3) Rotate to compute AABB size
    const a = (Math.abs(angleDeg) * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);

    const width = Math.abs(w * cos) + Math.abs(h * sin);
    const height = Math.abs(w * sin) + Math.abs(h * cos);

    return { width, height, ascent: metrics.ascent, descent: metrics.descent };
  };
}

function fontCacheKey(font: FontSpec) {
  return [
    font.family ?? '',
    String(font.size),
    font.style ?? 'normal',
    String(normalizeFontWeight(font.weight)),
  ].join('|');
}

function normalizeFontWeight(
  weight: FontSpec['weight']
):
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
  | '900' {
  if (weight === undefined || weight === 'normal') return '400';
  if (weight === 'medium') return '500';
  if (weight === 'semibold') return '600';
  if (weight === 'bold') return '700';
  if (typeof weight === 'number') {
    const normalized = String(weight) as
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900';
    return NUMERIC_WEIGHTS.has(normalized) ? normalized : '400';
  }
  return '400';
}

const NUMERIC_WEIGHTS = new Set([
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]);
