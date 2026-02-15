import { describe, expect, it } from "vitest";
import type { Series } from "../model/types";
import { downsampleSeries } from "./downsample";
import { stackSeries } from "./stack";

describe("stackSeries", () => {
  it("stacks positive and negative values independently", () => {
    const input: Series[] = [
      {
        id: "A",
        data: [
          { x: 0, y: 5 },
          { x: 1, y: -2 },
        ],
      },
      {
        id: "B",
        data: [
          { x: 0, y: 3 },
          { x: 1, y: -4 },
        ],
      },
    ];

    const out = stackSeries(input);
    expect(out).toHaveLength(2);

    const a0 = out[0]?.data[0];
    const b0 = out[1]?.data[0];
    expect(a0?.y0).toBe(0);
    expect(a0?.y1).toBe(5);
    expect(b0?.y0).toBe(5);
    expect(b0?.y1).toBe(8);

    const a1 = out[0]?.data[1];
    const b1 = out[1]?.data[1];
    expect(a1?.y0).toBe(0);
    expect(a1?.y1).toBe(-2);
    expect(b1?.y0).toBe(-2);
    expect(b1?.y1).toBe(-6);
  });

  it("aligns series by x and fills missing values with zero", () => {
    const input: Series[] = [
      { id: "A", data: [{ x: 0, y: 2 }] },
      { id: "B", data: [{ x: 1, y: 3 }] },
    ];

    const out = stackSeries(input);
    expect(out[0]?.data.map((d) => d.x)).toEqual([0, 1]);
    expect(out[0]?.data.map((d) => d.y)).toEqual([2, 0]);
    expect(out[1]?.data.map((d) => d.y)).toEqual([0, 3]);
  });
});

describe("downsampleSeries", () => {
  it("keeps endpoints and reduces dense input", () => {
    const source: Series = {
      id: "S",
      data: Array.from({ length: 100 }, (_, i) => ({
        x: i,
        y: Math.sin(i / 5) * 10,
      })),
    };

    const out = downsampleSeries(source, { maxPoints: 20 });
    expect(out.data.length).toBeLessThanOrEqual(20);
    expect(out.data[0]).toEqual(source.data[0]);
    expect(out.data[out.data.length - 1]).toEqual(source.data[source.data.length - 1]);
  });

  it("returns input when already below maxPoints", () => {
    const source: Series = {
      id: "S",
      data: [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ],
    };
    const out = downsampleSeries(source, { maxPoints: 10 });
    expect(out).toBe(source);
  });
});

