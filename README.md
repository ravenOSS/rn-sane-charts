# rn-sane-viz

Opinionated, mobile-first data visualization for React Native.

> **Pre-release:** the `@rn-sane-viz` npm scope is being provisioned. The
> install command below will work after the first alpha is published.

## Vision

`rn-sane-viz` helps React Native teams turn ordinary business data into clear,
professional visualizations without becoming chart-design experts.

The goal is not to offer every chart type or expose every visual variable. The
goal is to make the common dashboard decision the easy one: provide data,
choose an appropriate visual form, and receive a readable result.

## Why This Project Exists

Mobile charts have less room, less precise input, and less tolerance for visual
clutter than their desktop counterparts. Yet many charting APIs begin by asking
developers to configure margins, ticks, colors, legends, interactions, and
responsive behavior before a useful chart appears.

`rn-sane-viz` starts from the opposite direction. It owns those routine design
decisions and leaves applications to describe their data and intent.

That means:

- labels should avoid collisions automatically;
- legends should stay out of the plot;
- touch targets should work for fingers, not cursors;
- light and dark themes should remain coherent;
- business charts should look deliberate before customization.

## Why Another Visualization Library?

React Native already has capable charting libraries. Most optimize for breadth,
maximum configurability, or compatibility with an existing chart ecosystem.
Those are valid goals, but they often move design responsibility into every
application.

`rn-sane-viz` is intentionally narrower:

- React Native is the primary platform, not an adaptation target.
- Skia is the rendering foundation.
- D3 is used for visualization math, never DOM rendering.
- The core package is deterministic and independent of React Native.
- The public API favors a small set of composable business-chart primitives.
- New options must justify their cost to every future user.

You describe the data and what the chart should communicate. The library
handles recurring layout, styling, and mobile-interaction decisions, so you
spend less time tuning each chart and get consistent results across a
dashboard.

## Philosophy

### Opinionated over configurable

Defaults are part of the product. Configuration should refine a good result,
not rescue an unfinished one.

### Business dashboards first

The library prioritizes comparisons, trends, distributions, targets, and other
questions common to operational and product dashboards. It is not intended to
be a scientific plotting system or a chart zoo.

### Readability over density

Automatic margins, tick skipping, label rotation, and responsive legend
placement may show less information when that makes the information easier to
understand.

### Mobile interaction by default

Tap and scrub interactions, responsive sizing, and touch-friendly hit areas are
treated as core behavior rather than optional desktop features.

### Simple APIs age better

Every prop becomes a concept users must learn and maintainers must support.
When behavior can be inferred consistently, inference wins.

## Features

Available in the current pre-release codebase:

- line and area charts, including stacked area;
- vertical and horizontal bars, including grouped and stacked bars;
- scatter plots and histograms;
- responsive chart sizing and adaptive layout;
- automatic x-axis label rotation and tick skipping;
- automatic legend placement with focus-first interaction;
- tap and scrub tooltips with crosshairs;
- marker annotations and narrative chart notes;
- light and dark theme presets with partial overrides;
- deterministic scales, layout, transforms, and hit testing in
  `@rn-sane-viz/core`;
- Skia rendering in `@rn-sane-viz/rn`.

The project deliberately excludes web rendering, financial chart types,
zoom/brush interactions, and exhaustive visual customization from its initial
scope.

## Quick Start

After the first alpha is published, install both packages with the same
dist-tag:

```bash
pnpm add @rn-sane-viz/rn@alpha @rn-sane-viz/core@alpha @shopify/react-native-skia
```

Skia uses native code, so use an Expo development build or a React Native
native build rather than relying on Expo Go. The complete setup, font wiring,
and platform checkpoints are in
[Getting Started](docs/GETTING_STARTED.md).

## Example

Charts compose a layout container with one or more series renderers:

```tsx
import React from 'react';
import { Platform, View } from 'react-native';
import { matchFont } from '@shopify/react-native-skia';
import { Chart, LineSeries, makeSkiaMeasureText } from '@rn-sane-viz/rn';
import type { Series } from '@rn-sane-viz/core';

const revenue: Series = {
  id: 'Revenue',
  data: [
    { x: new Date(2026, 0, 1), y: 120 },
    { x: new Date(2026, 0, 2), y: 132 },
    { x: new Date(2026, 0, 3), y: 128 },
  ],
};

export default function RevenueChart() {
  const family = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  });
  const font = React.useMemo(
    () => matchFont({ fontFamily: family, fontSize: 12 }),
    [family]
  );

  if (!font) return null;

  return (
    <View>
      <Chart
        width={360}
        height={240}
        series={[revenue]}
        title="Revenue"
        fonts={{
          measureText: makeSkiaMeasureText(font),
          xTickFont: { family, size: 12 },
          yTickFont: { family, size: 12 },
          titleFont: { family, size: 17, weight: 'semibold' },
          subtitleFont: { family, size: 12 },
        }}
      >
        <LineSeries series={revenue} />
      </Chart>
    </View>
  );
}
```

The chart applies its layout, theme, axes, and series styling defaults. Add
configuration only when the data or product context requires it.

## Comparison With Existing Libraries

Choose `rn-sane-viz` when you want a focused React Native visualization system
that makes routine dashboard-design decisions for you.

Choose a broader charting library when your priority is a large catalog of
specialized chart types or detailed control over every mark.

Choose an ecosystem wrapper when sharing chart definitions with an existing
web visualization stack matters more than React Native-specific behavior.

`rn-sane-viz` does not attempt to replace those tools. Its tradeoff is
deliberate: less breadth and fewer controls in exchange for consistent defaults,
mobile-first interaction, and a smaller API to learn.

## Contributing

Contributions should strengthen the defaults before expanding the options.
Before proposing a feature, ask whether the library can infer the behavior,
whether it applies across chart types, and whether it makes the common case
easier.

Changes must address a problem shared across the library rather than encode one
application's specific requirements. If your use case depends on specialized
chart types, workflows, or extensive visual controls, implementing it in your
application—or choosing a more configurable library—will likely be a better
fit. Keeping that boundary allows `rn-sane-viz` to remain coherent and
predictable for everyone.

Start with [Philosophy](docs/PHILOSOPHY.md), then [Contributing](CONTRIBUTING.md)
and [AGENTS.md](AGENTS.md). For local validation:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
```

Additional documentation:

- [Philosophy](docs/PHILOSOPHY.md)
- [User Guide](docs/USER_GUIDE.md)
- [Design Guide](docs/DESIGN_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Product requirements](docs/PRD.md)
