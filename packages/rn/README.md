# @rn-sane-charts/rn

React Native-first business charts with sensible defaults, Skia rendering, and a small API.

Documentation:
- User guide: `docs/USER_GUIDE.md`
- API: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`
- Product scope: `docs/PRD.md`

## Is This A Fit?

Use `rn-sane-charts` if you want:
- Readable mobile charts with minimal setup
- Deterministic axis/tick layout (including x-label rotation/skipping)
- Skia-rendered performance and interaction headroom
- A small opinionated API over a highly-configurable chart zoo

This is likely not a fit if you need:
- Web renderer support
- Highly bespoke chart grammars
- Heavy runtime theming/config engines

## Installation

```sh
npm install @rn-sane-charts/rn @rn-sane-charts/core @shopify/react-native-skia
```

## Data Shape First

The library does not fetch or parse data. You pass in-memory objects.

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

Example:

```ts
const series = [
  {
    id: "Revenue",
    data: Array.from({ length: 50 }, (_, i) => ({
      x: new Date(2026, 0, i + 1),
      y: 20 + Math.sin(i / 5) * 6 + i * 0.1,
    })),
  },
];
```

## Quick Start (Shortest Path)

```tsx
import React from "react";
import { Platform, View } from "react-native";
import { matchFont } from "@shopify/react-native-skia";
import { Chart, LineSeries, makeSkiaMeasureText } from "@rn-sane-charts/rn";

const series = [
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

## Styling Model

- Defaults are built in.
- `theme` is a partial override of defaults.
- Per-series props (`color`, `strokeWidth`) override theme for that series.
- Fonts are layout-critical (not cosmetic only), because axis sizing uses text measurement.

## Streaming Data

`rn-sane-charts` consumes in-memory arrays; it does not manage sockets or polling.

Recommended app-layer pattern:
1. Receive JSON messages in your app.
2. Convert payloads to `Series[]`.
3. Keep a fixed-size ring buffer per series.
4. Update chart props on a throttled cadence (for example 100-250ms).

## Next Step

After first render:
1. Add more `LineSeries` children for multi-series charts.
2. Centralize shared `theme` and `fonts` in an app-level chart config file.
