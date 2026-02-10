# rn-sane-charts

React Native-first charting library for clear, professional data communication with sane defaults and a small API.

## Objectives

- Ship the 5 core business chart types: line, area, bar (grouped/stacked), scatter, histogram.
- Make charts readable by default on mobile.
- Keep API surface small and teachable.
- Maintain strong performance for common dashboard workloads.
- Enable fast implementation of multiple chart types with minimal per-chart overhead.

## Pragmatic Defaults (Fast Implementation)

- Readability-first axis behavior: auto rotate labels (`0°`, `45°`, `90°`) + tick skipping.
- Legend auto behavior: hidden for single series, auto position for multi-series, optional interactivity.
- Built-in tooltip/crosshair interactions.
- Light/dark theme presets with simple token overrides.
- Opinionated layout so charts look professional with minimal props.

## Layered Architecture = Fast Delivery

- `@rn-sane-charts/core` handles deterministic chart math (scales, layout, collision, transforms).
- `@rn-sane-charts/rn` focuses on Skia rendering and touch interaction.
- Result: teams can add many chart types quickly, with shared planning logic and minimal repeated setup per chart.

## Easy Overrides (Customize Without API Bloat)

You can override only what you need:

- Series style: color, stroke width, opacity, markers.
- Axis formatting: `formatX`, `formatY`, `tickCounts`, `xTickValues`.
- Interaction: `snap`, `crosshair`, tooltip on/off.
- Legend: show/hide, position, interactive mode.
- Theme + fonts: pass partial theme and custom font specs.

## Why Skia

- Native rendering pipeline (no SVG bottlenecks).
- Smooth gestures and drawing for dense charts.
- Precise control over text, paths, and clipping.
- Good fit for performance-sensitive RN data visualization.

## New Architecture Integration

- Built for modern React Native + Expo workflows.
- Works with New Architecture assumptions in current RN/Expo stacks.
- Core math/layout remains deterministic and testable, separate from RN UI rendering.

## How To Use

### 1. Install (package usage)

```bash
pnpm add @rn-sane-charts/rn @rn-sane-charts/core @shopify/react-native-skia
```

### 2. Compose charts with `ResponsiveChart` + series components

```tsx
import React from "react";
import { ResponsiveChart, LineSeries } from "@rn-sane-charts/rn";
import type { Series } from "@rn-sane-charts/core";

const revenue: Series = {
  id: "Revenue",
  data: [
    { x: new Date("2026-01-01"), y: 120 },
    { x: new Date("2026-01-02"), y: 132 },
    { x: new Date("2026-01-03"), y: 128 },
  ],
};

export function RevenueChart({ fonts }: { fonts: any }) {
  return (
    <ResponsiveChart
      series={[revenue]}
      title="Revenue"
      subtitle="Last 3 days"
      xAxisTitle="Date"
      yAxisTitle="USD"
      aspectRatio={1.6}
      minHeight={200}
      interaction={{ enabled: true, snap: "index", tooltip: true }}
      legend={{ interactive: true, interactionMode: "toggle" }}
      fonts={fonts}
      colorScheme="light"
    >
      <LineSeries series={revenue} color="#2563EB" strokeWidth={2.4} />
    </ResponsiveChart>
  );
}
```

### 3. Use explicit sizing when needed

Use `Chart` directly when layout must be fully deterministic (fixed-size exports, screenshot tests, exact dashboards).

### 4. Render multiple chart types quickly

Create one `Chart` per visualization and reuse shared `fonts`, theme, and formatting helpers.

## Current Status

- MVP in progress.
- Implemented: line, area (single), bar/grouped/stacked, scatter, histogram.
- Planned: stacked area completion, marker annotations API, deeper perf harnessing.

## Docs

- Product goals: `docs/PRD.md`
- Architecture: `docs/ARCHITECTURE.md`
- API details: `docs/API.md`
- User guide: `docs/USER_GUIDE.md`
