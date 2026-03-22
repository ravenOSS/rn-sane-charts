import React from 'react';
import type { Series } from '@rn-sane-charts/core';
import { buildPoints } from '@rn-sane-charts/core';
import { useChartContext } from '../context';
import {
  DEFAULT_INTERACTION_HIT_RADIUS_PX,
  useScatterHitRadiusRegistration,
} from '../scatterHitRadiusRegistry';
import { DEFAULT_SERIES_ACCENT } from '../theme/defaultTheme';
import { MarkerGlyph, type MarkerStyle, type MarkerSymbol } from './markerSymbol';

export type ScatterSeriesProps = {
  series: Series;
  color?: string;
  symbol?: MarkerSymbol;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  opacity?: number;
  /**
   * Screen-space hit radius (px) for scrubbing / tooltip selection.
   * Defaults to 44px; forwarded to `Chart` interaction via an internal registry.
   */
  hitRadiusPx?: number;
};

/**
 * Draw a scatter series from core point geometry.
 *
 * Why we delegate point building to core:
 * - Keeps scale projection deterministic and testable.
 * - Reuses shared geometry path used by hit-testing/interaction layers.
 */
export function ScatterSeries(props: ScatterSeriesProps) {
  const {
    scales,
    theme,
    hiddenSeriesIds,
    seriesColorById,
    resolveSeriesEmphasis,
  } = useChartContext();
  const registerScatterHitRadius = useScatterHitRadiusRegistration();

  const hitRadiusPx = props.hitRadiusPx ?? DEFAULT_INTERACTION_HIT_RADIUS_PX;
  const isHidden = hiddenSeriesIds.has(props.series.id);
  React.useLayoutEffect(() => {
    if (isHidden) {
      registerScatterHitRadius(props.series.id, undefined);
      return () => registerScatterHitRadius(props.series.id, undefined);
    }
    registerScatterHitRadius(props.series.id, hitRadiusPx);
    return () => registerScatterHitRadius(props.series.id, undefined);
  }, [props.series.id, hitRadiusPx, registerScatterHitRadius, isHidden]);

  if (isHidden) return null;

  const points = React.useMemo(
    () => buildPoints(props.series, scales),
    [props.series, scales]
  );

  const fallbackColor = DEFAULT_SERIES_ACCENT;
  const color =
    props.color ??
    seriesColorById.get(props.series.id) ??
    theme.series.palette[0] ??
    fallbackColor;
  const emphasis = resolveSeriesEmphasis(props.series.id);
  const size = props.size ?? 8;
  const opacity = clampOpacity(props.opacity ?? 0.9);
  const marker: MarkerStyle = {
    symbol: props.symbol ?? 'circle',
    size: size * emphasis.markerSizeMultiplier,
    color,
    opacity: opacity * emphasis.opacity,
    strokeWidth: props.strokeWidth ?? 1.5,
    filled: props.filled ?? true,
  };

  return (
    <>
      {points.map((pt, index) => (
        <MarkerGlyph
          key={`scatter-${index}-${pt.x}-${pt.y}`}
          x={pt.x}
          y={pt.y}
          {...marker}
        />
      ))}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}
