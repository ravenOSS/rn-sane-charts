import React from 'react';

/**
 * Default hit radius (px) for plot interaction when no series-specific override
 * is registered (line/area/bar/histogram points).
 *
 * Matches the spatial-index default in core and aligns with ~44px touch-target
 * guidance for interactive charts.
 */
export const DEFAULT_INTERACTION_HIT_RADIUS_PX = 44;

export type ScatterHitRadiusRegistry = {
  register: (seriesId: string, radiusPx: number | undefined) => void;
};

export const ScatterHitRadiusRegistryContext =
  React.createContext<ScatterHitRadiusRegistry | null>(null);

/**
 * Lets `ScatterSeries` register per-series hit radii for `Chart` interaction.
 * No-op when used outside `Chart` (should not happen for real series).
 */
export function useScatterHitRadiusRegistration(): ScatterHitRadiusRegistry['register'] {
  const ctx = React.useContext(ScatterHitRadiusRegistryContext);
  if (!ctx) {
    return () => {};
  }
  return ctx.register;
}
