// packages/core/src/scales/makeScales.ts

import type { DomainNumber, DomainDate } from "../model/types";
import type { Rect } from "../layout/computeLayout"; // OK: core internal link
import { createLinearScale } from "./linear";
import { createTimeScale } from "./time";

/**
 * Scale bundle for the common "time-series line/area" chart.
 *
 * We define these as factories so:
 * - geometry and interaction code can rely on consistent conventions
 * - renderer packages don't need to understand d3
 */
export function makeTimeSeriesScales(input: {
  plot: Rect;
  xDomain: DomainDate;
  yDomain: DomainNumber;
}) {
  const { plot, xDomain, yDomain } = input;

  // Pixel coordinates: left->right for x, bottom->top for y (inverted range).
  const x = createTimeScale(xDomain, [plot.x, plot.x + plot.width]);
  const y = createLinearScale(yDomain, [plot.y + plot.height, plot.y]);

  return { x, y };
}