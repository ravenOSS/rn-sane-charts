# API.md

## Scope And Status

This document defines the API shape for MVP chart types and clearly separates:
- `Implemented`: available now
- `Planned (MVP)`: expected API direction, not yet shipped

MVP chart types from PRD:
1. Line
2. Area (including stacked)
3. Bar (grouped + stacked)
4. Scatter
5. Histogram

## Shared Data Contracts

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

type CategoryDatum = {
  x: string | number;
  y: number;
};

type GroupedBarDatum = {
  category: string;
  values: Record<string, number>;
};

type StackedBarDatum = {
  category: string;
  values: Record<string, number>;
};

type ScatterDatum = {
  x: number;
  y: number;
  r?: number;
};

type MarkerSymbol =
  | "circle"
  | "plus"
  | "cross"
  | "square"
  | "diamond"
  | "triangle";

type MarkerStyle = {
  symbol?: MarkerSymbol;
  size?: number;
  color: string;
  opacity?: number;
  strokeWidth?: number;
  filled?: boolean;
};
```

## Shared Components

### `Chart` (Implemented)

```ts
type ChartProps = {
  width: number;
  height: number;
  series: Series[];
  title?: string;
  subtitle?: string;
  storyNote?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
  yIncludeZero?: boolean;
  formatX?: (d: Date) => string;
  formatY?: (v: number) => string;
  tickCounts?: { x?: number; y?: number };
  xTickValues?: Date[];
  xTickDomainMode?: "slots" | "exact";
  legend?: {
    show?: boolean;
    position?: "auto" | "right" | "bottom";
    interactive?: boolean;
    interactionMode?: "focus" | "toggle" | "isolate";
    items?: Array<{ id: string; label?: string; color?: string }>;
  };
  annotations?: {
    markers?: Array<{
      id?: string;
      x: Date | number;
      y: number;
      label?: string;
      color?: string;
      size?: number;
    }>;
  };
  interaction?: {
    enabled?: boolean;
    crosshair?: "none" | "x" | "xy";
    snap?: "nearest" | "index";
    tooltip?: boolean;
  };
  fonts: SaneChartFonts;
  colorScheme?: "light" | "dark" | "system";
  theme?: Partial<SaneChartTheme>;
  children: React.ReactNode;
};
```

Behavior:
- Built-in defaults are always applied first.
- `colorScheme` selects the base preset (`"system"` follows device appearance).
- `theme` is a partial override of defaults.
- `storyNote` renders concise narrative context under subtitle and wraps to fit
  the plot width (no ellipsis).
- Axis label orientation is auto-resolved (`0°`, `45°`, `90°`) with tick skipping.
- Legend defaults to vertical and auto-positioned (`right` on wider charts,
  otherwise `bottom`), and is hidden for single-series charts unless `show` is forced.
- Auto right-legend placement only occurs when enough plot width remains after
  legend reservation; otherwise it falls back to bottom.
- For bottom legends, label widths are measured and the legend switches to a
  horizontal row only when all items fit the available chart width.
- `legend.interactive` enables legend tap interactions.
- `legend.interactionMode` controls legend tap behavior:
  - `"toggle"`: hide/show one series at a time.
  - `"isolate"`: show only the tapped series; tap it again to restore all.
- Design policy note: prefer focus + de-emphasis for comparison tasks; use
  hide/reveal interaction modes as fallback for exceptional clutter.
- `interaction` enables touch crosshair + tooltip behavior:
  - `snap: "nearest"` focuses the nearest data point.
  - `snap: "index"` snaps to the nearest x-slot and shows all series values at that slot.
  - `crosshair` controls whether x-only or x/y crosshair lines are shown.
- `xTickValues` can pin ticks to explicit x positions (useful for category-like
  charts mapped onto time slots).
- `xTickDomainMode` controls edge behavior with explicit ticks:
  - `"slots"` adds half-step edge padding (bar/grouped/stacked/histogram friendly)
  - `"exact"` uses first/last tick as domain bounds (line/area edge alignment)
- `annotations.markers` renders lightweight in-plot marker overlays with optional labels.

### `ResponsiveChart` (Implemented)

```ts
type ResponsiveChartProps = Omit<ChartProps, "width" | "height"> & {
  width?: number;
  height?: number;
  aspectRatio?: number;
  minHeight?: number;
  maxHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
};
```

Behavior:
- Wraps `Chart` and derives dimensions from parent width by default.
- Preserves proportions using `aspectRatio` (`width / height`).
- Applies explicit `width` / `height` overrides when provided.
- Supports optional `minHeight` / `maxHeight` clamps for responsive layouts.

### `SaneChartFonts` (Implemented)

```ts
type SaneChartFonts = {
  measureText: MeasureTextFn;
  xTickFont: FontSpec;
  yTickFont: FontSpec;
  titleFont: FontSpec;
  subtitleFont: FontSpec;
  storyNoteFont?: FontSpec;
  xAxisTitleFont?: FontSpec;
  yAxisTitleFont?: FontSpec;
};
```

### `SaneChartTheme` (Implemented)

```ts
type SaneChartTheme = {
  background: string;
  frame: { stroke: string; strokeWidth: number };
  grid: { stroke: string; strokeWidth: number };
  axis: {
    tick: { color: string };
    line: { stroke: string; strokeWidth: number };
  };
  series: {
    palette: string[];
    strokeWidth: number;
  };
};
```

Theme presets exported by `@rn-sane-charts/rn`:
- `lightTheme`
- `darkTheme`
- `defaultTheme` (alias of `lightTheme`)

## Chart Types

### Line

Status: `Implemented`

Component:

```ts
type LineSeriesProps = {
  series: Series;
  color?: string;
  strokeWidth?: number;
  marker?: Omit<MarkerStyle, "color"> & { color?: string };
};
```

Notes:
- Render multiple lines by adding multiple `LineSeries` children.
- Per-series `color` and `strokeWidth` override theme defaults.

---

### Area (including stacked)

Status: `Implemented (single + stacked)`

Data shape:
- Same `Series[]` contract as line charts.
- Stacked mode expects multiple compatible series with aligned `x` semantics.

Current component:

```ts
type AreaSeriesProps = {
  series: Series;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  baselineY?: number;
  marker?: Omit<MarkerStyle, "color"> & { color?: string };
};
```

Notes:
- `AreaSeries` is implemented for single-series area rendering.
- `StackedAreaSeries` is implemented for stacked area rendering from multiple aligned series.

Additional component:

```ts
type StackedAreaSeriesProps = {
  series: Series[];
  colors?: readonly string[];
  fillOpacity?: number;
  strokeWidth?: number;
};
```

---

### Bar (grouped + stacked)

Status: `Implemented (series renderers)`

Data shape:
- Categorical x-values in series data (`x: string | number`, `y: number`).
- Grouped bars are modeled as `GroupedBarDatum[]`.
- Stacked bars are modeled as `StackedBarDatum[]`.

Current components:

```ts
type BarDataLabelsConfig = {
  position?: "outside" | "inside" | "none";
  color?: string;
  formatter?: (value: number, datum: Datum, seriesId: string) => string;
  minFontSize?: number;
  maxFontSize?: number;
  padding?: number;
};

type BarSeriesProps = {
  series: Series;
  color?: string;
  opacity?: number;
  widthRatio?: number;
  baselineY?: number;
  dataLabels?: BarDataLabelsConfig;
};

type GroupedBarSeriesProps = {
  series: Series[];
  colors?: readonly string[];
  opacity?: number;
  groupWidthRatio?: number;
  baselineY?: number;
  dataLabels?: BarDataLabelsConfig;
};

type StackedBarSeriesProps = {
  series: Series[];
  colors?: readonly string[];
  opacity?: number;
  widthRatio?: number;
  baselineY?: number;
  dataLabels?: BarDataLabelsConfig;
};
```

Notes:
- `dataLabels.position` defaults to `"none"` (opt-in labels).
- `"outside"` places labels away from the bar baseline direction.
- `"inside"` places labels near the top interior of each bar/segment.
- Label font size is auto-fitted per bar and hidden when constraints are too tight.

---

### Scatter

Status: `Implemented`

Data shape:

```ts
type ScatterDatum = {
  x: number;
  y: number;
  r?: number;
};
```

Current component:

```ts
type ScatterSeriesProps = {
  series: Series;
  color?: string;
  symbol?: MarkerSymbol;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  opacity?: number;
  hitRadiusPx?: number;
};
```

Notes:
- `hitRadiusPx` is currently reserved and not wired into interaction hit-testing.

---

### Histogram

Status: `Implemented (renderer); binning in core`

Data shape:
- Raw numeric array in app/core transforms: `number[]`
- RN histogram renderer currently consumes precomputed bins.

Current component:

```ts
type HistogramSeriesProps = {
  bins: Array<{ x0: number | Date; x1: number | Date; count: number }>;
  color?: string;
  opacity?: number;
  gapPx?: number;
  baselineY?: number;
};
```

Typical flow:
1. Build bins with `binHistogram(values, options)` from `@rn-sane-charts/core`.
2. Pass resulting bins into `HistogramSeries`.

## Data Ingestion Boundary

`rn-sane-charts` consumes in-memory data only.

Out of scope for chart API:
- Fetching data
- Streaming transport
- CSV parsing
- File loading

Application layer responsibility:
1. Ingest payloads (JSON, websocket, GraphQL, etc.).
2. Validate and map to chart data contracts.
3. Pass shaped data into chart props.

## Example Config Targets

The examples app maintains chart-type visual presets in
`packages/examples/chartConfig.ts` under `exampleChartTypeConfig`.

Current keys:
- `line`: `strokeWidth`, `colors`
- `area`: `fillOpacity`, `strokeWidth`, `colors`, `baselineY`
- `bar`: `barRadius`, `barGapPx`, `color`
- `groupedBar`: `barRadius`, `groupGapPx`, `colors`
- `stackedBar`: `barRadius`, `colors`
- `scatter`: `pointRadius`, `selectedPointRadius`, `color`
- `histogram`: `bins`, `color`, `barGapPx`

These options are an app-level config shape today and a reference target for
future renderer prop design.
