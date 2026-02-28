import { describe, expect, it } from "vitest";
import type { MeasureTextFn } from "./measureTextTypes";
import {
  computeLegendItemBoxes,
  computeLegendLayout,
  findLegendHit,
} from "./legend";

const measureText: MeasureTextFn = ({ text }) => ({
  width: text.length * 7,
  height: 12,
});

describe("legend layout", () => {
  it("hides single-item legend by default", () => {
    const layout = computeLegendLayout({
      chartWidth: 360,
      items: [{ id: "a", label: "A", color: "#2563EB" }],
      measureText,
      font: { family: "System", size: 12, weight: 400 },
    });
    expect(layout.show).toBe(false);
    expect(layout.reservedBottom).toBe(0);
    expect(layout.reservedRight).toBe(0);
  });

  it("uses right legend placement on wide charts when it fits", () => {
    const layout = computeLegendLayout({
      chartWidth: 520,
      items: [
        { id: "a", label: "Series A", color: "#2563EB" },
        { id: "b", label: "Series B", color: "#16A34A" },
      ],
      measureText,
      font: { family: "System", size: 12, weight: 400 },
    });
    expect(layout.show).toBe(true);
    expect(layout.position).toBe("right");
    expect(layout.reservedRight).toBeGreaterThan(0);
  });

  it("falls back to bottom when right legend would squeeze plot too much", () => {
    const layout = computeLegendLayout({
      chartWidth: 520,
      items: [
        { id: "a", label: "Very Long Series Label A", color: "#2563EB" },
        { id: "b", label: "Very Long Series Label B", color: "#16A34A" },
      ],
      measureText,
      font: { family: "System", size: 12, weight: 400 },
      metrics: {
        rightPlacementMinChartWidthPx: 420,
        rightPlacementMaxWidthRatio: 0.6,
        rightPlacementMinPlotWidthPx: 360,
      },
    });

    expect(layout.show).toBe(true);
    expect(layout.position).toBe("bottom");
    expect(layout.reservedBottom).toBeGreaterThan(0);
    expect(layout.reservedRight).toBe(0);
  });

  it("computes deterministic item boxes and legend hit testing", () => {
    const legend = computeLegendLayout({
      chartWidth: 360,
      items: [
        { id: "a", label: "Series A", color: "#2563EB" },
        { id: "b", label: "Series B", color: "#16A34A" },
      ],
      measureText,
      font: { family: "System", size: 12, weight: 400 },
      show: true,
      position: "bottom",
    });

    const boxes = computeLegendItemBoxes({
      chartWidth: 360,
      chartHeight: 240,
      layout: {
        bounds: { x: 0, y: 0, width: 360, height: 240 },
        header: { x: 12, y: 12, width: 336, height: 24 },
        plot: { x: 40, y: 36, width: 308, height: 160 },
        xAxis: { x: 40, y: 196, width: 308, height: 32 },
        yAxis: { x: 12, y: 36, width: 28, height: 160 },
        decisions: { xAxis: { labelAngle: 0, ticks: [] } },
        padding: { top: 12, right: 12, bottom: 12, left: 12 },
      },
      legend,
    });

    expect(boxes.length).toBe(2);
    const first = boxes[0];
    expect(first).toBeDefined();

    const hit = findLegendHit(boxes, (first?.x ?? 0) + 1, (first?.y ?? 0) + 1);
    expect(hit?.id).toBe("a");
  });
});
