// packages/core/src/validate/validateSeries.ts

import { addError, addWarning, createDiagnostics, isFiniteNumber, type Diagnostics } from "./diagnostics";
import type { Series } from "../model/types";

export type ValidateSeriesOptions = {
  /**
   * If true, empty series are treated as errors.
   * MVP default: warn, because dashboards sometimes load async.
   */
  strictNonEmpty?: boolean;

  /**
   * If true, we warn when x values are not monotonic (time-series expectation).
   * Not all charts need monotonic x, but it helps users catch surprises.
   */
  warnIfXNotSorted?: boolean;
};

/**
 * Validate multi-series time-series input for line/area charts.
 *
 * Notes:
 * - We do not "fix" data here (no sorting, no filtering). That belongs to app or transforms.
 * - We only detect common pitfalls and return actionable diagnostics.
 */
export function validateSeriesInput(series: Series[], options?: ValidateSeriesOptions): Diagnostics {
  const d = createDiagnostics();
  const strictNonEmpty = options?.strictNonEmpty ?? false;
  const warnIfXNotSorted = options?.warnIfXNotSorted ?? true;

  if (!Array.isArray(series) || series.length === 0) {
    addError(d, "SERIES_EMPTY", "Expected at least one series.", "series");
    return d;
  }

  for (let si = 0; si < series.length; si++) {
    const s = series[si];

    // With `noUncheckedIndexedAccess`, array indexing is treated as possibly undefined.
    if (!s) {
      addError(d, "SERIES_INVALID", "Series entry is missing.", `series[${si}]`);
      continue;
    }

    if (typeof s.id !== "string" || s.id.trim().length === 0) {
      addError(d, "SERIES_ID_INVALID", "Series must have a non-empty string id.", `series[${si}].id`);
    }

    if (!Array.isArray(s.data)) {
      addError(d, "SERIES_DATA_INVALID", "Series.data must be an array.", `series[${si}].data`);
      continue;
    }

    if (s.data.length === 0) {
      const msg = "Series has no data points.";
      if (strictNonEmpty) addError(d, "SERIES_DATA_EMPTY", msg, `series[${si}].data`);
      else addWarning(d, "SERIES_DATA_EMPTY", msg, `series[${si}].data`);
      continue;
    }

    let lastX: number | null = null;

    for (let di = 0; di < s.data.length; di++) {
      const pt = s.data[di];

      // x: number | Date
      const x = pt?.x;
      let xNum: number | null = null;

      if (x instanceof Date) {
        xNum = x.getTime();
        if (!Number.isFinite(xNum)) {
          addError(d, "DATUM_X_INVALID", "Datum.x Date is invalid.", `series[${si}].data[${di}].x`);
        }
      } else if (isFiniteNumber(x)) {
        xNum = x;
      } else {
        addError(d, "DATUM_X_INVALID", "Datum.x must be a finite number or a Date.", `series[${si}].data[${di}].x`);
      }

      // y: finite number
      if (!isFiniteNumber(pt?.y)) {
        addError(d, "DATUM_Y_INVALID", "Datum.y must be a finite number.", `series[${si}].data[${di}].y`);
      }

      if (warnIfXNotSorted && xNum != null && lastX != null && xNum < lastX) {
        addWarning(
          d,
          "DATUM_X_NOT_SORTED",
          "x values appear unsorted. For time-series charts, sort by x for best results.",
          `series[${si}].data[${di}].x`
        );
      }

      if (xNum != null) lastX = xNum;
    }
  }

  return d;
}