import { describe, expect, it } from "vitest";
import type { MeasureTextFn } from "../layout/measureTextTypes";
import { resolveXAxisLabels } from "./resolveXAxisLabels";

const measureText: MeasureTextFn = ({ text }) => ({
  width: text.length * 10,
  height: 12,
});

describe("resolveXAxisLabels", () => {
  it("treats rotated labels as right-edge anchored on tick x", () => {
    const resolved = resolveXAxisLabels(
      [
        { value: 0, label: "A", x: 0 },
        { value: 1, label: "BBBBBBBBBB", x: 50 },
      ],
      measureText,
      {
        font: { family: "System", size: 12, weight: 400 },
        anglesToTry: [45],
        minLabelGapPx: 4,
      }
    );

    // With right-edge anchoring, the long second label extends left into the
    // first label's slot, so this should not resolve as collision-free.
    expect(resolved.debug?.reason).toBe("fallback-first-last");
    expect(resolved.ticks).toHaveLength(2);
  });
});
