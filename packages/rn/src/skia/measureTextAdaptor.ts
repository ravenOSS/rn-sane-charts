import type { SkFont } from '@shopify/react-native-skia';
import type {
  MeasureTextFn,
  TextMeasureInput,
  TextMeasureResult,
} from '@rn-sane-charts/core';

/**
 * Create a core-compatible `measureText` function using a Skia font instance.
 *
 * Core requirement:
 * - Return axis-aligned bounding box (AABB) width/height AFTER rotation.
 *
 * Rotation math:
 * - Compute rotated AABB dimensions from the unrotated width/height using trig.
 * - This is conservative (collision-safe) and fast.
 */
export function makeSkiaMeasureText(font: SkFont): MeasureTextFn {
  return (input: TextMeasureInput): TextMeasureResult => {
    const angleDeg = input.angle ?? 0;

    // 1) Unrotated width
    const m = font.measureText(input.text);
    const w = m.width;

    // 2) Unrotated height from font metrics (ascent is typically negative)
    const metrics = font.getMetrics();
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
