// packages/examples/App.tsx
import React from "react";
import { Platform, View } from "react-native";
import { matchFont } from "@shopify/react-native-skia";

import { Chart, LineSeries, makeSkiaMeasureText } from "@rn-sane-charts/rn";
import type { Series } from "@rn-sane-charts/core";

const data: Series[] = [
  {
    id: "Revenue",
    data: Array.from({ length: 50 }, (_, i) => ({
      x: new Date(2026, 0, i + 1),
      y: 20 + Math.sin(i / 5) * 6 + i * 0.1,
    })),
  },
];

export default function App() {
  /**
   * We intentionally use a system font here (via `matchFont`) instead of bundling a .ttf asset.
   *
   * Why:
   * - Keeps this repo lightweight (no binary font files).
   * - Avoids Metro resolution errors when the font asset is missing.
   *
   * If you want brand-accurate typography later, add a real .ttf and switch to `useFont`.
   */
  const fontFamily = Platform.select({ ios: "Helvetica", default: "sans-serif" });
  const font = React.useMemo(() => matchFont({ fontFamily, fontSize: 12 }), [fontFamily]);

  if (!font) return null;

  const measureText = makeSkiaMeasureText(font);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Chart
        width={360}
        height={240}
        series={data}
        title="Revenue"
        subtitle="Last 50 days"
        fonts={{
          measureText,
          xTickFont: { size: 12, family: fontFamily },
          yTickFont: { size: 12, family: fontFamily },
          titleFont: { size: 16, family: fontFamily, weight: "semibold" },
          subtitleFont: { size: 12, family: fontFamily },
        }}
      >
        <LineSeries series={data[0]} />
      </Chart>
    </View>
  );
}