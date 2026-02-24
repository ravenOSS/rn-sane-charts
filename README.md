# rn-sane-charts

React Native-first charting library for clear, professional data communication with sane defaults and a small API.

## Start Here

Choose the path that matches your experience level:

1. New to the library or starting fresh:
   - [GETTING_STARTED.md](docs/GETTING_STARTED.md)
2. Integrating into an existing project (experienced devs):
   - [USER_GUIDE.md](docs/USER_GUIDE.md)

## Objectives

- Ship the 5 core business chart types: line, area, bar (grouped/stacked), scatter, histogram.
- Make charts readable by default on mobile.
- Keep API surface small and teachable.
- Maintain strong performance for common dashboard workloads.
- Enable fast implementation of multiple chart types with minimal per-chart overhead.

## Pragmatic Defaults (Fast Implementation)

- Readability-first axis behavior: auto rotate labels (`0°`, `45°`, `90°`) + tick skipping.
- Legend auto behavior: hidden for single series, auto position for multi-series, interactive `focus` by default (`toggle`/`isolate` optional).
- Built-in tooltip/crosshair interactions.
- Light/dark theme presets with simple token overrides and focus/muted state tokens.
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

## Quick Usage

Install packages:

```bash
pnpm add @rn-sane-charts/rn @rn-sane-charts/core @shopify/react-native-skia
```

Compose a basic chart:

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
      legend={{ interactive: true }}
      fonts={fonts}
      colorScheme="light"
    >
      <LineSeries series={revenue} color="#2563EB" strokeWidth={2.4} />
    </ResponsiveChart>
  );
}
```

For setup flow, troubleshooting, and first-success checkpoints, use:

- [GETTING_STARTED.md](docs/GETTING_STARTED.md)

## Current Status

- MVP in progress.
- Implemented: line, area (single + stacked), bar/grouped/stacked, scatter, histogram, marker annotations.
- Planned: deeper perf harnessing and additional interaction/perf optimizations.

## Docs By Intent

- First success (fresh project): [GETTING_STARTED.md](docs/GETTING_STARTED.md)
- Experienced usage patterns: [USER_GUIDE.md](docs/USER_GUIDE.md)
- Design policy and rationale: [DESIGN_GUIDE.md](docs/DESIGN_GUIDE.md)
- API surface details: [API.md](docs/API.md)
- Internal architecture: [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Product scope and goals: [PRD.md](docs/PRD.md)
- Delivery status and release path: [ROADMAP.md](docs/ROADMAP.md)

## Contributing

Contributions are welcome. Start with `CONTRIBUTING.md`, then run:

```bash
pnpm install
pnpm typecheck
pnpm test
```

Architecture expectations:

- `@rn-sane-charts/core`: deterministic math/layout/transforms.
- `@rn-sane-charts/rn`: Skia rendering + interaction wiring.
