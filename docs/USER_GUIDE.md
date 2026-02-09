# USER_GUIDE.md

## What This Library Is

`rn-sane-charts` is a React Native-first charting library for professional-looking business charts with minimal setup.

Best fit:
- You want a chart on screen quickly with sane defaults.
- You care about readable axes and labels on mobile.
- You prefer a small API over high-flexibility configuration systems.

## First Decision: Data Shape

Before styling, make sure your data is in the expected shape.

For line/area-style series:

```ts
type Datum = {
  x: number | Date;
  y: number;
  [key: string]: any;
};

type Series = {
  id: string;
  data: Datum[];
};
```

Notes:
- `x` can be a timestamp (`Date`) or number.
- `y` must be numeric.
- Data should already be fetched and normalized by your app.

## Shortest Path To First Render

```tsx
import React from "react";
import { Platform, View } from "react-native";
import { matchFont } from "@shopify/react-native-skia";
import { Chart, LineSeries, makeSkiaMeasureText } from "@rn-sane-charts/rn";
import type { Series } from "@rn-sane-charts/core";

const series: Series[] = [
  {
    id: "Revenue",
    data: Array.from({ length: 50 }, (_, i) => ({
      x: new Date(2026, 0, i + 1),
      y: 20 + Math.sin(i / 5) * 6 + i * 0.1,
    })),
  },
];

export default function App() {
  const fontFamily = Platform.select({ ios: "Helvetica", default: "sans-serif" });
  const font = React.useMemo(() => matchFont({ fontFamily, fontSize: 12 }), [fontFamily]);
  if (!font) return null;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Chart
        width={360}
        height={240}
        series={series}
        title="Revenue"
        subtitle="Last 50 days"
        xAxisTitle="Date"
        yAxisTitle="USD"
        fonts={{
          measureText: makeSkiaMeasureText(font),
          xTickFont: { size: 12, family: fontFamily },
          yTickFont: { size: 12, family: fontFamily },
          titleFont: { size: 16, family: fontFamily, weight: "semibold" },
          subtitleFont: { size: 12, family: fontFamily },
        }}
      >
        <LineSeries series={series[0]} />
      </Chart>
    </View>
  );
}
```

## Multi-Series Pattern

Pass multiple series in `Chart.series`, and render one `LineSeries` per series.

```tsx
<Chart series={allSeries} {...rest}>
  <LineSeries series={allSeries[0]} color="#2563EB" />
  <LineSeries series={allSeries[1]} color="#DC2626" />
  <LineSeries series={allSeries[2]} color="#16A34A" />
</Chart>
```

## Sample Dataset Catalog

The examples app includes ready-made datasets for each MVP chart type in:
- `packages/examples/sampleDatasets.ts`

Included fixtures:
1. `sampleLineSeries`
2. `sampleAreaSeries`
3. `sampleStackedAreaSeries`
4. `sampleBarData`
5. `sampleGroupedBarData`
6. `sampleStackedBarData`
7. `sampleScatterData`
8. `sampleHistogramValues`

Use these fixtures to validate renderer behavior and visual defaults across the
example gallery tabs.

## Accessibility Theme Check (Examples)

The gallery includes an `A11y Theme` tab that demonstrates:
- A color-blind-friendly series palette
- Higher-contrast axis tokens for light and dark schemes
- A live axis-text contrast check against background (target: `>= 4.5:1`)

Use this tab as a quick visual/functional gate before finalizing theme tokens.

## Styling After First Render

Default behavior:
- Library defaults are applied first.
- `colorScheme` picks the base light/dark preset (`"system"` follows device mode).
- `theme` props partially override defaults.
- Per-series props override theme for that series.

Recommended workflow:
1. Get a working chart with default styling.
2. Move shared fonts/theme to one app-level config module.
3. Use per-series overrides only for chart-specific emphasis.

Interaction defaults (opt-in):
1. Set `interaction.enabled` on `Chart`.
2. Use `snap: "index"` for business time-series comparison tooltips.
3. Use `snap: "nearest"` for dense scatter exploration.
4. Set `legend.interactive: true` for tap-to-toggle series visibility.
5. Use `legend.interactionMode: "isolate"` when users should compare one
   series at a time.

## Static vs Dynamic Inputs

Static (usually one-time setup):
- Theme palette
- Axis contrast
- Default font sizes and weights

Dynamic (changes at runtime):
- Incoming data values
- Highlighted series color
- Interaction-driven emphasis

## JSON And Streaming Data

`rn-sane-charts` does not fetch or stream data itself. Keep ingestion in your app.

Recommended pipeline:
1. Receive JSON payload from API/socket.
2. Validate and map payload into `Series[]`.
3. Append to in-memory buffers.
4. Pass updated arrays to chart props.

For high-frequency streams:
1. Keep a fixed-size ring buffer per series.
2. Batch updates on a short interval (100-250ms) instead of every message.
3. Preserve stable object shapes to reduce JS churn.

## Troubleshooting

If visual updates do not appear:
1. Clear Metro cache: `pnpm start -- --clear` from `packages/examples`.
2. Ensure workspace package aliasing is active in `packages/examples/metro.config.js`.
3. Re-run type checks for changed packages:
   - `pnpm --filter @rn-sane-charts/core typecheck`
   - `pnpm --filter @rn-sane-charts/rn typecheck`
