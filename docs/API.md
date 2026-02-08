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
  xAxisTitle?: string;
  yAxisTitle?: string;
  fonts: SaneChartFonts;
  theme?: Partial<SaneChartTheme>;
  children: React.ReactNode;
};
```

Behavior:
- Built-in defaults are always applied first.
- `theme` is a partial override of defaults.
- Axis label orientation is auto-resolved (`0°`, `45°`, `90°`) with tick skipping.

### `SaneChartFonts` (Implemented)

```ts
type SaneChartFonts = {
  measureText: MeasureTextFn;
  xTickFont: FontSpec;
  yTickFont: FontSpec;
  titleFont: FontSpec;
  subtitleFont: FontSpec;
  xAxisTitleFont?: FontSpec;
  yAxisTitleFont?: FontSpec;
};
```

### `SaneChartTheme` (Implemented)

```ts
type SaneChartTheme = {
  background: string;
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

## Chart Types

### Line

Status: `Implemented`

Component:

```ts
type LineSeriesProps = {
  series: Series;
  color?: string;
  strokeWidth?: number;
};
```

Notes:
- Render multiple lines by adding multiple `LineSeries` children.
- Per-series `color` and `strokeWidth` override theme defaults.

---

### Area (including stacked)

Status: `Partially Implemented (single-series area)`

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
};
```

Notes:
- `AreaSeries` is implemented for single-series area rendering.
- Stacked area behavior remains planned.

---

### Bar (grouped + stacked)

Status: `Planned (MVP)`

Data shape:
- Categorical x-values in series data (`x: string | number`, `y: number`).

Planned component direction:

```ts
type BarSeriesProps = {
  series: Series;
  color?: string;
  stacked?: boolean;
  grouped?: boolean;
};
```

---

### Scatter

Status: `Planned (MVP)`

Data shape:

```ts
type ScatterDatum = {
  x: number;
  y: number;
  r?: number;
};
```

Planned component direction:

```ts
type ScatterSeriesProps = {
  series: { id: string; data: ScatterDatum[] };
  color?: string;
  radius?: number;
};
```

---

### Histogram

Status: `Planned (MVP)`

Data shape:
- Raw numeric array: `number[]`
- Binning handled in core.

Planned component direction:

```ts
type HistogramProps = {
  values: number[];
  bins?: number;
  color?: string;
};
```

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
