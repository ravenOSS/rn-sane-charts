import { describe, expect, it } from "vitest";
import type { Series } from "../model/types";
import { computeXDomainTime } from "./domain";

describe("computeXDomainTime", () => {
  it("expands and nices time domain beyond observed min/max", () => {
    const observedMin = new Date("2026-01-01T00:00:00.000Z");
    const observedMax = new Date("2026-01-20T00:00:00.000Z");

    const series: Series[] = [
      {
        id: "s1",
        data: [
          { x: observedMin, y: 10 },
          { x: new Date("2026-01-10T00:00:00.000Z"), y: 15 },
          { x: observedMax, y: 12 },
        ],
      },
    ];

    const [min, max] = computeXDomainTime(series);

    expect(min.getTime()).toBeLessThan(observedMin.getTime());
    expect(max.getTime()).toBeGreaterThan(observedMax.getTime());
  });
});
