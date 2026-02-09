// packages/examples/App.tsx
import React from "react";
import { Platform, View } from "react-native";
import { matchFont } from "@shopify/react-native-skia";

import {
  AreaSeries,
  Chart,
  LineSeries,
  makeSkiaMeasureText,
} from "@rn-sane-charts/rn";
import {
  createExampleChartFonts,
  exampleChartTheme,
  exampleChartTypeConfig,
  exampleSeriesColors,
} from "./chartConfig";
import { sampleAreaSeries, sampleLineSeries } from "./sampleDatasets";

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
  const chartFonts = createExampleChartFonts({ fontFamily, measureText });

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Chart
        width={360}
        height={240}
        series={sampleLineSeries}
        title="Revenue"
        subtitle="Last 50 days"
        xAxisTitle="Date"
        yAxisTitle="USD"
        fonts={chartFonts}
        theme={exampleChartTheme}
      >
        <AreaSeries
          series={sampleAreaSeries}
          fillColor={exampleSeriesColors.revenue}
          fillOpacity={exampleChartTypeConfig.area.fillOpacity}
          strokeColor={exampleSeriesColors.revenue}
          strokeWidth={exampleChartTypeConfig.area.strokeWidth}
          baselineY={exampleChartTypeConfig.area.baselineY}
        />
        <LineSeries
          series={sampleLineSeries[0]}
          color={exampleSeriesColors.revenue}
          strokeWidth={exampleChartTypeConfig.line.strokeWidth}
        />
        <LineSeries
          series={sampleLineSeries[1]}
          color={exampleSeriesColors.forecast}
          strokeWidth={exampleChartTypeConfig.line.strokeWidth}
        />
        <LineSeries
          series={sampleLineSeries[2]}
          color={exampleSeriesColors.target}
          strokeWidth={exampleChartTypeConfig.line.strokeWidth}
        />
      </Chart>
    </View>
  );
}
