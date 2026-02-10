import React from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { Chart, type ChartProps } from './Chart';

export type ResponsiveChartProps = Omit<ChartProps, 'width' | 'height'> & {
  /**
   * Optional explicit width override.
   *
   * When omitted, the wrapper measures the parent width via `onLayout`.
   */
  width?: number;

  /**
   * Optional explicit height override.
   *
   * When omitted, height is derived from width / `aspectRatio`.
   */
  height?: number;

  /**
   * Width / height ratio used to derive responsive height.
   *
   * Example: 1.6 means width 320 => height 200.
   */
  aspectRatio?: number;

  /** Lower clamp for computed responsive height. */
  minHeight?: number;

  /** Upper clamp for computed responsive height. */
  maxHeight?: number;

  /** Style for the outer measuring container. */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Responsive wrapper around `Chart`.
 *
 * Why this component exists:
 * - `Chart` is intentionally low-level and deterministic: it expects concrete
 *   pixel bounds for width/height.
 * - App screens usually need charts that adapt to available width while
 *   preserving a stable aspect ratio.
 *
 * Sizing precedence:
 * 1. Explicit `width` / `height` props
 * 2. Measured parent width + derived height from `aspectRatio`
 * 3. Height clamps (`minHeight`, `maxHeight`)
 */
export function ResponsiveChart(props: ResponsiveChartProps) {
  const {
    width,
    height,
    aspectRatio = 1.6,
    minHeight = 180,
    maxHeight,
    containerStyle,
    ...chartProps
  } = props;

  const [measuredWidth, setMeasuredWidth] = React.useState(0);

  const onLayout = React.useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;

    setMeasuredWidth((prevWidth) =>
      Math.abs(prevWidth - nextWidth) < 0.5 ? prevWidth : nextWidth
    );
  }, []);

  const resolvedWidth = width ?? measuredWidth;
  const resolvedHeight = React.useMemo(
    () =>
      resolveResponsiveHeight({
        width: resolvedWidth,
        height,
        aspectRatio,
        minHeight,
        maxHeight,
      }),
    [resolvedWidth, height, aspectRatio, minHeight, maxHeight]
  );

  const canRender =
    Number.isFinite(resolvedWidth) &&
    resolvedWidth > 0 &&
    Number.isFinite(resolvedHeight) &&
    resolvedHeight > 0;

  return (
    <View style={[{ width: '100%' }, containerStyle]} onLayout={onLayout}>
      {canRender ? (
        <Chart
          {...chartProps}
          width={resolvedWidth}
          height={resolvedHeight}
        />
      ) : null}
    </View>
  );
}

/**
 * Resolves final chart height from responsive sizing inputs.
 *
 * Human reasoning:
 * - Aspect ratio keeps chart proportions predictable across phone/tablet widths.
 * - A minimum height prevents tiny unreadable plots on narrow containers.
 * - Optional max height avoids oversized charts in wide layouts.
 */
function resolveResponsiveHeight(input: {
  width: number;
  height?: number;
  aspectRatio: number;
  minHeight: number;
  maxHeight?: number;
}): number {
  if (Number.isFinite(input.height) && (input.height ?? 0) > 0) {
    return clampHeight(input.height as number, input.minHeight, input.maxHeight);
  }

  const safeAspectRatio =
    Number.isFinite(input.aspectRatio) && input.aspectRatio > 0
      ? input.aspectRatio
      : 1.6;
  const computed = input.width / safeAspectRatio;
  return clampHeight(computed, input.minHeight, input.maxHeight);
}

function clampHeight(value: number, minHeight: number, maxHeight?: number) {
  const min = Number.isFinite(minHeight) && minHeight > 0 ? minHeight : 1;
  const upper =
    Number.isFinite(maxHeight) && (maxHeight ?? 0) > 0
      ? (maxHeight as number)
      : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(value, min), upper);
}

