// packages/examples/App.tsx
import React from "react";
import { View } from "react-native";
import { useFont } from "@shopify/react-native-skia";

import { Chart, LineSeries } from "@rn-sane-charts/rn";
import { makeSkiaMeasureText } from "@rn-sane-charts/rn/src/skia/measureTextAdapter"; // until you export it nicely
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
  const font = useFont(require("./assets/Inter-Regular.ttf"), 12);

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
          xTickFont: { size: 12, family: "Inter" },
          yTickFont: { size: 12, family: "Inter" },
          titleFont: { size: 16, family: "Inter", weight: "semibold" },
          subtitleFont: { size: 12, family: "Inter" },
        }}
      >
        <LineSeries series={data[0]} />
      </Chart>
    </View>
  );
}