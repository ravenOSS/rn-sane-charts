import { describe, expect, it } from "vitest";
import { isPointInRect } from "./hitTestBars";
import { collectPointsAtAnchorX, findNearestPoint } from "./hitTestLine";
import { findNearestNumericValue } from "./hitTestScatter";

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
});

