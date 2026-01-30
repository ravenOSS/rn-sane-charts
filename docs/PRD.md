# PRD — rn-sane-charts

## Overview

**rn-sane-charts** is a React Native-first charting library designed to provide **clean, professional, readable business charts** with minimal configuration and strong performance.

The library prioritizes **clarity over flexibility**, making it easy for developers to produce high-quality visualizations without design expertise.

---

## Goals

* Deliver the 5 most common business chart types
* Ensure charts are readable on mobile devices
* Provide sensible design defaults
* Maintain high runtime performance
* Keep the API small and approachable
* Maintain a well-documented codebase for OSS collaboration

---

## Non-Goals (MVP)

* Web support
* Advanced financial charting
* Zooming and brushing
* Table components (interop only)
* Data ingestion/parsing (handled by the host app)

---

## Core Features

### Chart Types

1. Line (multi-series)
2. Area (stacked supported)
3. Bar (grouped and stacked)
4. Scatter
5. Histogram

### Universal Chart Features

* Title and subtitle
* Responsive layout
* Axis auto-formatting
* Tooltips
* Legend
* Marker annotations
* Theme support

---

## Axis Label Readability

X-axis labels must support:

* 0°, 45°, 90° rotation
* Automatic collision detection
* Tick skipping when necessary

Design principle: readability > density.

---

## Performance Targets

| Chart Type | Target Smoothness       |
| ---------- | ----------------------- |
| Line       | 5k points @ 60fps       |
| Scatter    | 1k points smooth        |
| Bars       | 500 categories readable |

---

## Architecture Principles

* Rendering handled by Skia
* Core math/layout separated from UI
* Deterministic layout engine
* Algorithms documented for auditability

---

## Example App & Dev Workflow (Current)

The monorepo includes an Expo example app under `packages/examples/`.

Current constraints:

* The example app targets **Expo SDK 55** (New Architecture only).
* During SDK 55 preview/beta, **Expo Go on physical devices may lag** and be incompatible.
* Use a **development build** (`expo-dev-client`) for reliable on-device testing.

---

## 📦 Data Input Model

rn-sane-charts **does not fetch, parse, or stream data**.
It consumes **in-memory JavaScript data structures** supplied by the host application.

### Time Series / Line / Area

```ts
type Datum = {
  x: number | Date
  y: number
  [key: string]: any
}

type Series = {
  id: string
  data: Datum[]
}
```

---

### Bar / Categorical

```ts
type CategoryDatum = {
  x: string | number
  y: number
}
```

---

### Scatter

```ts
type ScatterDatum = {
  x: number
  y: number
  r?: number
}
```

---

### Histogram

```ts
number[]
```

The library handles binning internally.

---

### Out of Scope for MVP

These belong to the **application layer**, not rn-sane-charts:

| Concern                | Responsibility |
| ---------------------- | -------------- |
| Fetching data          | App            |
| Parsing CSV            | App            |
| Streaming / WebSockets | App            |
| File loading           | App            |
| Data normalization     | App            |

rn-sane-charts responds only to **data passed via props**.

---

## Documentation Standard

All layout, geometry, and heuristic code must include inline documentation explaining:

* Why the logic exists
* Tradeoffs made
* Future extension points

This is required for contributor friendliness and maintainability.

---

## Future Expansion (Not MVP)

* Financial charts
* Web renderer
* Advanced axis heuristics
* Theming packs
* Zoom/brush interactions

---

## Success Criteria

* Developers can create a readable chart in <10 lines of code
* Charts look good without design tweaking
* Performance remains smooth under realistic loads
* Contributors can understand and extend code without reverse engineering
