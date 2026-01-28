// packages/core/src/format/number.ts

import { format as d3format } from "d3-format";

/**
 * Default numeric formatter.
 *
 * Philosophy:
 * - Business charts should avoid noise.
 * - This formatter tries to produce compact, human-readable labels.
 *
 * Future extension:
 * - Locale-aware formatting
 * - Currency/percent helpers
 */
export function formatNumberDefault(value: number): string {
  // If near-integer, show integer.
  if (Number.isFinite(value) && Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }

  // Compact for large numbers; otherwise show up to ~3 significant digits.
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return d3format(".2s")(value); // e.g. 1.2M
  if (abs >= 10_000) return d3format(".3s")(value); // e.g. 12.3k
  if (abs >= 1) return d3format(".3~g")(value); // e.g. 12.3, 1.23
  if (abs > 0) return d3format(".2~g")(value); // e.g. 0.12
  return "0";
}