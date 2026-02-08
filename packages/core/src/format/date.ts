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
const fmtYear = timeFormat("%Y");         // 2026
const fmtTime = timeFormat("%-I:%M %p");  // 3:05 PM

export function formatDateDefault(d: Date): string {
  // Heuristic: if there's a time component, show time; otherwise show day.
  if (d.getHours() || d.getMinutes() || d.getSeconds()) return fmtTime(d);
  // If it's the first of the month, show month/year (often meaningful boundaries).
  if (d.getDate() === 1) return fmtMonth(d);
  return fmtDay(d);
}

/**
 * Build a date formatter tuned to the visible domain span.
 *
 * Why:
 * - Tick generation currently operates on numeric milliseconds which can yield
 *   non-midnight Date values for multi-day domains.
 * - Using a domain-aware formatter prevents "clock time" labels on charts that
 *   conceptually represent days/weeks/months.
 *
 * Rules (MVP):
 * - >= 365 days: show year
 * - >= 60 days: show month/year
 * - >= 2 days: show day
 * - otherwise: show clock time
 */
export function makeDomainDateFormatter(domain: [Date, Date]) {
  const spanMs = Math.max(0, domain[1].getTime() - domain[0].getTime());
  const dayMs = 24 * 60 * 60 * 1000;

  if (spanMs >= dayMs * 365) return fmtYear;
  if (spanMs >= dayMs * 60) return fmtMonth;
  if (spanMs >= dayMs * 2) return fmtDay;
  return fmtTime;
}
