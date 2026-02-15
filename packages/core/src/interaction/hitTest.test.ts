import { describe, expect, it } from "vitest";
import { isPointInRect } from "./hitTestBars";
import { collectPointsAtAnchorX, findNearestPoint } from "./hitTestLine";
import {
  buildScatterSpatialIndex,
  findNearestNumericValue,
  findNearestPointInScatterIndex,
} from "./hitTestScatter";

describe("interaction hit-test helpers", () => {
  it("finds nearest 2D point", () => {
    const nearest = findNearestPoint(
      [
        { x: 10, y: 10, id: "a" },
        { x: 20, y: 20, id: "b" },
        { x: 100, y: 100, id: "c" },
      ],
      19,
      18
    );
    expect(nearest?.id).toBe("b");
  });

  it("collects points around an x anchor using tolerance", () => {
    const grouped = collectPointsAtAnchorX(
      [
        { x: 40, y: 10, id: "a" },
        { x: 40.3, y: 20, id: "b" },
        { x: 45, y: 30, id: "c" },
      ],
      40,
      0.5
    );
    expect(grouped.map((point) => point.id)).toEqual(["a", "b"]);
  });

  it("finds nearest numeric anchor", () => {
    expect(findNearestNumericValue([0, 25, 50, 75], 61)).toBe(50);
  });

  it("checks inclusive point-in-rect", () => {
    const rect = { x: 10, y: 20, width: 50, height: 40 };
    expect(isPointInRect(10, 20, rect)).toBe(true);
    expect(isPointInRect(60, 60, rect)).toBe(true);
    expect(isPointInRect(61, 60, rect)).toBe(false);
  });

  it("finds nearest point through scatter spatial index", () => {
    const points = [
      { x: 10, y: 10, id: "a" },
      { x: 40, y: 25, id: "b" },
      { x: 92, y: 90, id: "c" },
      { x: 140, y: 20, id: "d" },
    ];
    const index = buildScatterSpatialIndex(points, 32);
    const nearest = findNearestPointInScatterIndex(index, 35, 24);
    expect(nearest?.id).toBe("b");
  });

  it("matches linear nearest-neighbor result for deterministic set", () => {
    const points = Array.from({ length: 128 }, (_, index) => ({
      x: (index * 17) % 211,
      y: (index * 31) % 197,
      id: `p-${index}`,
    }));
    const index = buildScatterSpatialIndex(points, 24);
    const queries = [
      [5, 9],
      [66, 44],
      [130, 180],
      [200, 15],
      [90, 90],
    ] as const;

    for (const [qx, qy] of queries) {
      const expected = findNearestPoint(points, qx, qy);
      const actual = findNearestPointInScatterIndex(index, qx, qy);
      expect(actual?.id).toBe(expected?.id);
    }
  });
});
