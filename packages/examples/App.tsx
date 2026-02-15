import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { matchFont } from "@shopify/react-native-skia";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { Series } from "@rn-sane-charts/core";
import { binHistogram, stackSeries } from "@rn-sane-charts/core";
import {
  AreaSeries,
  BarSeries,
  Chart,
  GroupedBarSeries,
  HistogramSeries,
  LineSeries,
  ScatterSeries,
  StackedAreaSeries,
  StackedBarSeries,
  makeSkiaMeasureText,
} from "@rn-sane-charts/rn";
import {
  accessibilityPalette,
  createAccessibilityTheme,
  createExampleChartFonts,
  exampleChartTheme,
  exampleChartTypeConfig,
  exampleSeriesColors,
} from "./chartConfig";
import {
  sampleAreaSeries,
  sampleBarData,
  sampleGroupedBarData,
  sampleHistogramValues,
  sampleLineSeries,
  sampleScatterData,
  sampleStackedAreaSeries,
  sampleStackedBarData,
} from "./sampleDatasets";
import { runInteractionPerfHarness, type PerfRunResult } from "./perfHarness";

type GalleryView =
  | "line"
  | "area"
  | "stackedArea"
  | "bar"
  | "groupedBar"
  | "stackedBar"
  | "scatter"
  | "histogram"
  | "a11yTheme"
  | "perf";

const viewOptions: { id: GalleryView; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "stackedArea", label: "Stacked Area" },
  { id: "bar", label: "Bar" },
  { id: "groupedBar", label: "Grouped Bar" },
  { id: "stackedBar", label: "Stacked Bar" },
  { id: "scatter", label: "Scatter" },
  { id: "histogram", label: "Histogram" },
  { id: "a11yTheme", label: "A11y Theme" },
  { id: "perf", label: "Perf" },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const CATEGORY_BASE = new Date(2026, 0, 1);

function toSlotDate(index: number): Date {
  return new Date(CATEGORY_BASE.getTime() + index * DAY_MS);
}

function indexFormatter(labels: string[]) {
  return (d: Date) => {
    const idx = Math.round((d.getTime() - CATEGORY_BASE.getTime()) / DAY_MS);
    return idx >= 0 && idx < labels.length ? labels[idx] ?? "" : "";
  };
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected 6-digit hex color, received: ${hex}`);
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

/**
 * WCAG relative luminance for sRGB colors.
 *
 * Contrast checks require linear-light math; raw RGB values are not perceptual.
 */
function relativeLuminance(hexColor: string): number {
  const { r, g, b } = parseHexColor(hexColor);
  const srgb = [r, g, b].map((channel) => channel / 255);
  const linear = srgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/**
 * Returns contrast ratio like 4.5 for a "4.5:1" result.
 */
function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fg = relativeLuminance(foregroundHex);
  const bg = relativeLuminance(backgroundHex);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function GalleryApp() {
  const insets = useSafeAreaInsets();
  const systemColorScheme = useColorScheme();
  const chartColorScheme: "light" | "dark" =
    systemColorScheme === "dark" ? "dark" : "light";
  const pageBackground = chartColorScheme === "dark" ? "#0B1220" : "#FFFFFF";
  const headingColor = chartColorScheme === "dark" ? "#E5E7EB" : "#1F2937";
  const subtitleColor = chartColorScheme === "dark" ? "#94A3B8" : "#4B5563";
  const fontFamily = Platform.select({ ios: "Helvetica", default: "sans-serif" });
  const font = React.useMemo(
    () => matchFont({ fontFamily, fontSize: 12 }),
    [fontFamily]
  );

  const [activeView, setActiveView] = React.useState<GalleryView>("line");
  const [perfResults, setPerfResults] = React.useState<PerfRunResult[]>([]);
  const [perfRunAt, setPerfRunAt] = React.useState<string>("");

  const barSeries = React.useMemo<Series>(
    () => ({
      id: "Net Cash Flow",
      data: sampleBarData.map((d, i) => ({
        x: toSlotDate(i),
        y: d.y,
      })),
    }),
    []
  );
  const barLabels = React.useMemo(
    () => sampleBarData.map((d) => String(d.x)),
    []
  );
  const barTickValues = React.useMemo(
    () => sampleBarData.map((_, i) => toSlotDate(i)),
    []
  );

  const groupedBarSeries = React.useMemo<Series[]>(() => {
    const keys = Object.keys(sampleGroupedBarData[0]?.values ?? {});
    return keys.map((key) => ({
      id: key,
      data: sampleGroupedBarData.map((row, i) => ({
        x: toSlotDate(i),
        y: row.values[key] ?? 0,
      })),
    }));
  }, []);
  const groupedBarLabels = React.useMemo(
    () => sampleGroupedBarData.map((row) => row.category),
    []
  );
  const groupedBarTickValues = React.useMemo(
    () => sampleGroupedBarData.map((_, i) => toSlotDate(i)),
    []
  );

  const stackedBarSeries = React.useMemo<Series[]>(() => {
    const keys = Object.keys(sampleStackedBarData[0]?.values ?? {});
    return keys.map((key) => ({
      id: key,
      data: sampleStackedBarData.map((row, i) => ({
        x: toSlotDate(i),
        y: row.values[key] ?? 0,
      })),
    }));
  }, []);
  const stackedBarTotalsSeries = React.useMemo<Series>(
    () => ({
      id: "__stacked_total_domain__",
      data: sampleStackedBarData.map((row, i) => ({
        x: toSlotDate(i),
        y: Object.values(row.values).reduce((sum, value) => sum + value, 0),
      })),
    }),
    []
  );
  const stackedBarChartSeries = React.useMemo<Series[]>(
    () => [...stackedBarSeries, stackedBarTotalsSeries],
    [stackedBarSeries, stackedBarTotalsSeries]
  );
  const stackedBarLegendItems = React.useMemo(
    () =>
      stackedBarSeries.map((series, index) => ({
        id: series.id,
        label: series.id,
        color:
          exampleChartTypeConfig.stackedBar.colors[
            index % exampleChartTypeConfig.stackedBar.colors.length
          ],
      })),
    [stackedBarSeries]
  );
  const stackedBarLabels = React.useMemo(
    () => sampleStackedBarData.map((row) => row.category),
    []
  );
  const stackedBarTickValues = React.useMemo(
    () => sampleStackedBarData.map((_, i) => toSlotDate(i)),
    []
  );

  const scatterSeries = React.useMemo<Series>(
    () => ({
      id: "Signal",
      data: sampleScatterData.map((pt) => ({
        x: toSlotDate(pt.x),
        y: pt.y,
      })),
    }),
    []
  );
  const scatterLabels = React.useMemo(
    () => Array.from({ length: 16 }, (_, i) => `X${i}`),
    []
  );
  const scatterTickValues = React.useMemo(
    () => Array.from({ length: 16 }, (_, i) => toSlotDate(i)),
    []
  );

  const areaTickValues = React.useMemo(
    () =>
      sampleAreaSeries.data
        .map((d) => d.x)
        .filter((x): x is Date => x instanceof Date),
    []
  );
  const stackedAreaSeries = React.useMemo<Series[]>(
    () => sampleStackedAreaSeries,
    []
  );
  const stackedAreaTickValues = React.useMemo(
    () =>
      (sampleStackedAreaSeries[0]?.data ?? [])
        .map((d) => d.x)
        .filter((x): x is Date => x instanceof Date),
    []
  );
  const stackedAreaDomainSeries = React.useMemo<Series[]>(() => {
    const stacked = stackSeries(sampleStackedAreaSeries);
    if (stacked.length === 0) return [];

    const first = stacked[0];
    const last = stacked[stacked.length - 1];
    if (!first || !last) return [];

    return [
      {
        id: "__stacked_area_upper_domain__",
        data: last.data.map((d) => ({ x: d.x, y: d.y1 })),
      },
      {
        id: "__stacked_area_lower_domain__",
        data: first.data.map((d) => ({ x: d.x, y: d.y0 })),
      },
    ];
  }, []);
  const stackedAreaLegendItems = React.useMemo(
    () =>
      stackedAreaSeries.map((series, index) => ({
        id: series.id,
        label: series.id,
        color:
          exampleChartTypeConfig.area.colors[
            index % exampleChartTypeConfig.area.colors.length
          ],
      })),
    [stackedAreaSeries]
  );
  const lineTickValues = React.useMemo(
    () =>
      sampleLineSeries[0].data
        .map((d) => d.x)
        .filter((x): x is Date => x instanceof Date),
    []
  );
  const lineAnnotations = React.useMemo(
    () => [
      {
        id: "release-cutover",
        x: sampleLineSeries[0].data[24]?.x ?? new Date(2026, 0, 25),
        y: (sampleLineSeries[0].data[24]?.y ?? 0) + 2,
        label: "Release",
        color: "#DC2626",
      },
    ],
    []
  );

  const histogramBins = React.useMemo(
    () =>
      binHistogram(sampleHistogramValues, {
        binCount: exampleChartTypeConfig.histogram.bins,
      }),
    []
  );
  const histogramPlotBins = React.useMemo(
    () =>
      histogramBins.map((bin, i) => ({
        x0: toSlotDate(i),
        x1: toSlotDate(i + 1),
        count: bin.count,
      })),
    [histogramBins]
  );
  const histogramSeries = React.useMemo<Series[]>(
    () => [
      {
        id: "Sample Values",
        data: histogramPlotBins.map((bin, i) => ({
          x: toSlotDate(i),
          y: bin.count,
        })),
      },
    ],
    [histogramPlotBins]
  );
  const histogramTickValues = React.useMemo(
    () => histogramPlotBins.map((bin) => bin.x0),
    [histogramPlotBins]
  );

  if (!font) return null;

  const measureText = makeSkiaMeasureText(font);
  const chartFonts = createExampleChartFonts({ fontFamily, measureText });
  const accessibilityTheme = React.useMemo(
    () => createAccessibilityTheme(chartColorScheme),
    [chartColorScheme]
  );
  const accessibilityContrastRatio = React.useMemo(() => {
    const background = accessibilityTheme.background ?? "#FFFFFF";
    const tickColor =
      accessibilityTheme.axis?.tick?.color ??
      (chartColorScheme === "dark" ? "#FFFFFF" : "#111827");
    return contrastRatio(tickColor, background);
  }, [accessibilityTheme, chartColorScheme]);
  const accessibilityContrastPass = accessibilityContrastRatio >= 4.5;
  const commonChartProps = {
    fonts: chartFonts,
    theme: exampleChartTheme,
    colorScheme: chartColorScheme,
  };

  const runPerfHarness = React.useCallback(() => {
    const results = runInteractionPerfHarness();
    setPerfResults(results);
    setPerfRunAt(new Date().toLocaleTimeString());
  }, []);

  React.useEffect(() => {
    if (activeView !== "perf" || perfResults.length > 0) return;
    runPerfHarness();
  }, [activeView, perfResults.length, runPerfHarness]);

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: pageBackground,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: headingColor }]}>
          rn-sane-charts gallery
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          Step through each chart type renderer.
        </Text>

        <View style={styles.chartPanel}>
          {activeView === "line" ? (
            <Chart
              width={360}
              height={240}
              series={sampleLineSeries}
              title="Revenue Plan Tracking"
              subtitle="Actual vs forecast vs target (last 50 days)"
              xAxisTitle="Date"
              yAxisTitle="USD"
              xTickValues={lineTickValues}
              xTickDomainMode="exact"
              legend={{ interactive: true, interactionMode: "isolate" }}
              interaction={{
                enabled: true,
                crosshair: "x",
                snap: "index",
                tooltip: true,
              }}
              annotations={{ markers: lineAnnotations }}
              {...commonChartProps}
            >
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
          ) : null}

          {activeView === "area" ? (
            <Chart
              width={360}
              height={240}
              series={[sampleAreaSeries]}
              title="Daily Active Users"
              subtitle="Last 50 days"
              xAxisTitle="Date"
              yAxisTitle="Users"
              xTickValues={areaTickValues}
              xTickDomainMode="exact"
              {...commonChartProps}
            >
              <AreaSeries
                series={sampleAreaSeries}
                fillColor="#0EA5E9"
                fillOpacity={exampleChartTypeConfig.area.fillOpacity}
                strokeColor="#0EA5E9"
                strokeWidth={exampleChartTypeConfig.area.strokeWidth}
                baselineY={exampleChartTypeConfig.area.baselineY}
              />
              <LineSeries
                series={sampleAreaSeries}
                color="#0EA5E9"
                strokeWidth={exampleChartTypeConfig.line.strokeWidth}
              />
            </Chart>
          ) : null}

          {activeView === "stackedArea" ? (
            <Chart
              width={360}
              height={240}
              series={stackedAreaDomainSeries}
              title="Traffic Source Mix"
              subtitle="Stacked daily contribution by channel"
              xAxisTitle="Date"
              yAxisTitle="Users"
              xTickValues={stackedAreaTickValues}
              xTickDomainMode="exact"
              legend={{ items: stackedAreaLegendItems, show: true }}
              {...commonChartProps}
            >
              <StackedAreaSeries
                series={stackedAreaSeries}
                colors={[...exampleChartTypeConfig.area.colors]}
                fillOpacity={exampleChartTypeConfig.area.fillOpacity}
                strokeWidth={exampleChartTypeConfig.area.strokeWidth}
              />
            </Chart>
          ) : null}

          {activeView === "bar" ? (
            <Chart
              width={360}
              height={240}
              series={[barSeries]}
              title="Daily Net Cash Flow"
              subtitle="Inflows minus outflows by weekday"
              xAxisTitle="Day"
              yAxisTitle="USD (k)"
              yIncludeZero
              formatX={indexFormatter(barLabels)}
              xTickValues={barTickValues}
              xTickDomainMode="slots"
              tickCounts={{ x: barLabels.length, y: 6 }}
              {...commonChartProps}
            >
              <BarSeries
                series={barSeries}
                color={exampleChartTypeConfig.bar.color}
                widthRatio={0.68}
              />
            </Chart>
          ) : null}

          {activeView === "groupedBar" ? (
            <Chart
              width={360}
              height={240}
              series={groupedBarSeries}
              title="Quarterly Revenue Plan"
              subtitle="Actual vs forecast vs target"
              xAxisTitle="Quarter"
              yAxisTitle="USD (k)"
              yIncludeZero
              formatX={indexFormatter(groupedBarLabels)}
              xTickValues={groupedBarTickValues}
              xTickDomainMode="slots"
              tickCounts={{ x: groupedBarLabels.length, y: 6 }}
              legend={{ interactive: true, interactionMode: "isolate" }}
              {...commonChartProps}
            >
              <GroupedBarSeries
                series={groupedBarSeries}
                colors={[...exampleChartTypeConfig.groupedBar.colors]}
                groupWidthRatio={0.82}
              />
            </Chart>
          ) : null}

          {activeView === "stackedBar" ? (
            <Chart
              width={360}
              height={240}
              series={stackedBarChartSeries}
              title="Regional Revenue Mix"
              subtitle="Stacked by segment"
              xAxisTitle="Region"
              yAxisTitle="USD (k)"
              yIncludeZero
              formatX={indexFormatter(stackedBarLabels)}
              xTickValues={stackedBarTickValues}
              xTickDomainMode="slots"
              tickCounts={{ x: stackedBarLabels.length, y: 6 }}
              legend={{
                items: stackedBarLegendItems,
                interactive: true,
                interactionMode: "isolate",
              }}
              {...commonChartProps}
            >
              <StackedBarSeries
                series={stackedBarSeries}
                colors={[...exampleChartTypeConfig.stackedBar.colors]}
                widthRatio={0.7}
              />
            </Chart>
          ) : null}

          {activeView === "scatter" ? (
            <Chart
              width={360}
              height={240}
              series={[scatterSeries]}
              title="Signal Samples"
              subtitle="Bucket index vs signal value"
              xAxisTitle="Bucket"
              yAxisTitle="Signal"
              formatX={indexFormatter(scatterLabels)}
              xTickValues={scatterTickValues}
              xTickDomainMode="slots"
              tickCounts={{ x: 8, y: 6 }}
              interaction={{
                enabled: true,
                crosshair: "xy",
                snap: "nearest",
                tooltip: true,
              }}
              {...commonChartProps}
            >
              <ScatterSeries
                series={scatterSeries}
                color={exampleChartTypeConfig.scatter.color}
                symbol="plus"
                size={9}
                strokeWidth={1.7}
                hitRadiusPx={22}
              />
            </Chart>
          ) : null}

          {activeView === "histogram" ? (
            <Chart
              width={360}
              height={240}
              series={histogramSeries}
              title="Sample Value Distribution"
              subtitle="Histogram of sample values"
              xAxisTitle="Value Bin"
              yAxisTitle="Frequency"
              yIncludeZero
              formatX={() => ""}
              xTickValues={histogramTickValues}
              xTickDomainMode="slots"
              tickCounts={{ x: 6, y: 6 }}
              {...commonChartProps}
            >
              <HistogramSeries
                bins={histogramPlotBins}
                color={exampleChartTypeConfig.histogram.color}
                gapPx={exampleChartTypeConfig.histogram.barGapPx}
              />
            </Chart>
          ) : null}

          {activeView === "a11yTheme" ? (
            <View style={styles.a11yPanel}>
              <Chart
                width={360}
                height={240}
                series={sampleLineSeries}
                title="Accessibility Theme Check"
                subtitle={`Axis contrast ${accessibilityContrastRatio.toFixed(
                  1
                )}:1 (target >= 4.5:1)`}
                xAxisTitle="Date"
                yAxisTitle="USD"
                xTickValues={lineTickValues}
                xTickDomainMode="exact"
                colorScheme={chartColorScheme}
                theme={accessibilityTheme}
                fonts={chartFonts}
              >
                <LineSeries
                  series={sampleLineSeries[0]}
                  color={accessibilityPalette[0]}
                  strokeWidth={2.4}
                />
                <LineSeries
                  series={sampleLineSeries[1]}
                  color={accessibilityPalette[1]}
                  strokeWidth={2.4}
                />
                <LineSeries
                  series={sampleLineSeries[2]}
                  color={accessibilityPalette[2]}
                  strokeWidth={2.4}
                />
              </Chart>
              <Text
                style={[
                  styles.a11yNote,
                  { color: accessibilityContrastPass ? "#15803D" : "#B91C1C" },
                ]}
              >
                {accessibilityContrastPass
                  ? "Pass: axis label contrast meets 4.5:1 text target."
                  : "Fail: axis label contrast below 4.5:1 text target."}
              </Text>
            </View>
          ) : null}

          {activeView === "perf" ? (
            <View style={styles.perfPanel}>
              <Text style={[styles.perfHeading, { color: headingColor }]}>
                Interaction Perf Harness
              </Text>
              <Text style={[styles.perfCopy, { color: subtitleColor }]}>
                Deterministic scenarios: 5k line index snap and 1k scatter nearest.
              </Text>
              <Pressable onPress={runPerfHarness} style={styles.perfRunButton}>
                <Text style={styles.perfRunButtonLabel}>Run Harness</Text>
              </Pressable>
              <Text style={[styles.perfStamp, { color: subtitleColor }]}>
                {perfRunAt ? `Last run: ${perfRunAt}` : "Not run yet"}
              </Text>
              <View style={styles.perfResults}>
                {perfResults.map((result) => (
                  <View key={result.scenario} style={styles.perfRow}>
                    <Text style={styles.perfScenario}>{result.scenario}</Text>
                    <Text style={styles.perfMetric}>
                      {result.totalMs.toFixed(2)} ms total
                    </Text>
                    <Text style={styles.perfMetric}>
                      {result.avgMsPerIteration.toFixed(4)} ms/op
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {viewOptions.map((option) => {
            const isActive = option.id === activeView;
            return (
              <Pressable
                key={option.id}
                onPress={() => setActiveView(option.id)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GalleryApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
  },
  chartPanel: {
    width: "100%",
    alignItems: "center",
    minHeight: 250,
    justifyContent: "center",
  },
  a11yPanel: {
    alignItems: "center",
    gap: 8,
  },
  a11yNote: {
    fontSize: 12,
    fontWeight: "500",
  },
  perfPanel: {
    width: 360,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
    gap: 8,
  },
  perfHeading: {
    fontSize: 16,
    fontWeight: "700",
  },
  perfCopy: {
    fontSize: 12,
    lineHeight: 16,
  },
  perfRunButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  perfRunButtonLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  perfStamp: {
    fontSize: 11,
  },
  perfResults: {
    gap: 8,
  },
  perfRow: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    padding: 8,
    gap: 2,
  },
  perfScenario: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
  },
  perfMetric: {
    color: "#374151",
    fontSize: 11,
  },
  tabs: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tab: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.20)",
    borderRadius: 999,
    width: 112,
    paddingVertical: 4,
    minHeight: 34,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tabActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  tabLabel: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 16,
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
});
