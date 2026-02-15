import { describe, expect, it } from "vitest";
import type { Series } from "../model/types";
import { buildAreaPath, buildStackedAreaPath } from "./areaPath";

describe("buildAreaPath", () => {
  const scales = {
    x: (v: unknown) => Number(v),
    y: (v: number) => Number(v),
  };

  it("builds a closed area path with baseline 0 by default", () => {
    const series: Series = {
      id: "s1",
      data: [
        { x: 0, y: 10 },
        { x: 10, y: 20 },
      ],
    };

    const { d } = buildAreaPath(series, scales);
    expect(d).toBe("M0,10L10,20L10,0L0,0Z");
  });

  it("supports a custom baseline", () => {
    const series: Series = {
      id: "s1",
      data: [
        { x: 0, y: 10 },
        { x: 10, y: 20 },
      ],
    };

    const { d } = buildAreaPath(series, scales, { baselineY: 5 });
    expect(d).toBe("M0,10L10,20L10,5L0,5Z");
  });

  it("returns empty path when all points are invalid", () => {
    const series: Series = {
      id: "s1",
      data: [
        { x: 0, y: Number.NaN },
        { x: Number.NaN, y: 10 },
      ],
    };

    const { d } = buildAreaPath(series, scales);
    expect(d).toBe("");
  });

  it("builds stacked area path from y0/y1 bands", () => {
    const { d } = buildStackedAreaPath(
      {
        id: "stack-1",
        data: [
          { x: 0, y: 10, y0: 2, y1: 10 },
          { x: 10, y: 16, y0: 4, y1: 16 },
        ],
      },
      scales
    );

    expect(d).toBe("M0,10L10,16L10,4L0,2Z");
  });
});
