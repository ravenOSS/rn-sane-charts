// packages/core/src/format/date.ts

import { timeFormat } from "d3-time-format";

/**
 * Default date formatter for ticks.
 *
 * MVP rule:
 * - Keep it simple and consistent.
 * - The RN layer can allow user overrides via `formatX`.
 */
const fmtDay = timeFormat("%b %-d");      // Jan 5
const fmtMonth = timeFormat("%b %Y");     // Jan 2026
const fmtTime = timeFormat("%-I:%M %p");  // 3:05 PM

export function formatDateDefault(d: Date): string {
  // Heuristic: if there's a time component, show time; otherwise show day.
  if (d.getHours() || d.getMinutes() || d.getSeconds()) return fmtTime(d);
  // If it's the first of the month, show month/year (often meaningful boundaries).
  if (d.getDate() === 1) return fmtMonth(d);
  return fmtDay(d);
}