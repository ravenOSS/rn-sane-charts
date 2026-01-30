# Architecture — rn-sane-charts

This document explains how **rn-sane-charts** is structured, why it is structured this way, and how data flows from user input to rendered pixels.

The goal is to make the system easy to understand, safe to extend, and predictable to maintain.

---

## High-Level Overview

rn-sane-charts is divided into **three primary layers**:

```md
Application Code
        ↓
@rn-sane-charts/rn   (React Native + Skia rendering)
        ↓
@rn-sane-charts/core (Pure math, layout, transforms)
        ↓
Skia Engine (native rendering)
```

### Responsibilities by Layer

| Layer        | Responsibility                                           |
| ------------ | -------------------------------------------------------- |
| **core**     | Data models, scales, layout, transforms, collision logic |
| **rn**       | React components, Skia drawing, gestures, tooltips       |
| **examples** | Expo app demonstrating usage and validating UX           |

The **core** package contains no React or Skia code.
The **rn** package contains no layout math beyond rendering decisions.

---

## Monorepo Layout (Current)

This repo is a pnpm workspace. The current top-level package layout is:

```md
packages/
  core/       (@rn-sane-charts/core — pure logic; no React/Skia)
  rn/         (@rn-sane-charts/rn — RN + Skia renderer)
  examples/   (Expo app used for development + UX validation)
```

Notes:

- `packages/rn/example/` exists because `@rn-sane-charts/rn` was bootstrapped from a RN library template.
- `packages/examples/` is the primary example/gallery app for this monorepo.
- `packages/examples/` targets **Expo SDK 55** (New Architecture only). **Expo Go may be incompatible** during SDK 55 preview/beta; use a development build (`expo-dev-client`) when needed.

---

## Data Flow Pipeline

Every chart follows the same conceptual pipeline:

```md
Raw Data (props)
    ↓
Validation & Normalization
    ↓
Transforms (stacking, binning, downsampling)
    ↓
Scales (data → pixels)
    ↓
Layout Engine (define plot + margins)
    ↓
Geometry Generation (paths, bars, points)
    ↓
Renderer (Skia draws primitives)
    ↓
Interaction Layer (hit testing, tooltips)
```

Each stage is deliberately separated so it can be:

- Tested independently
- Documented clearly
- Extended without breaking others

---

## Package: `@rn-sane-charts/core`

This package is framework-agnostic and contains deterministic logic.

### Modules

#### `model/`

Defines canonical data shapes used internally.

- Series
- Datum
- Axis config

#### `scales/`

Wraps D3 scale modules to convert domain values into pixel space.

- Linear scale
- Time scale
- Band scale
- Tick generation

#### `transforms/`

Pure functions that reshape or derive data.

- Stack series (area, bar)
- Histogram binning
- Downsampling (future)

#### `layout/`

Computes chart geometry *before* rendering.

Responsible for:

- Plot area
- Axis regions
- Title/subtitle space
- Label collision resolution

This is where **axis label rotation and tick skipping** are determined.

#### `collision/`

Algorithms for avoiding overlap:

- Tick label rotation
- Tick skipping
- Bounding box math

These algorithms must be thoroughly documented.

#### `interaction/`

Math for hit testing:

- Nearest point (line)
- Spatial bucketing (scatter)
- Bar hit regions

No UI code here — only geometry logic.

---

## Package: `@rn-sane-charts/rn`

This is the React Native + Skia layer.

### Responsibilities

- Rendering primitives
- React components
- Gesture handling
- Tooltip state
- Theme tokens

### Rendering Model

Skia primitives are used instead of SVG:

| Chart Element | Skia Primitive |
| ------------- | -------------- |
| Lines/Areas   | Path           |
| Bars          | Rect           |
| Points        | Circle         |
| Text          | Text           |
| Clip region   | ClipRect       |

Rendering is stateless: geometry comes from core, drawing happens here.

---

## Layout Philosophy

Layout is computed in **core** and consumed in **rn**.

This avoids:

- UI components doing layout math
- Hidden side effects
- Inconsistent spacing

Layout determines:

- Margins
- Axis label positions
- Legend region
- Title/subtitle region

Renderers only draw within the provided layout box.

---

## Interaction Architecture

Interactions are split into:

| Layer | Responsibility                      |
| ----- | ----------------------------------- |
| core  | Hit test math                       |
| rn    | Gesture detection + tooltip display |

This keeps gestures UI-specific and hit logic testable.

---

## Theme System

Themes are simple token maps:

```md
theme.axis.tick
theme.grid.line
theme.series.palette[]
theme.background
```

No dynamic theme engine in MVP.

---

## Seams for Future Features

The architecture intentionally leaves expansion points:

| Future Feature        | Where It Fits             |
| --------------------- | ------------------------- |
| Candlestick charts    | New series renderer       |
| Zooming               | Scale + layout extension  |
| Web renderer          | New rendering package     |
| Advanced label angles | Extend collision resolver |

These are **internal seams**, not public APIs.

---

## Why This Architecture Works

- Core is pure → easy to test
- RN layer is thin → easy to maintain
- Layout centralized → consistent visuals
- Interaction math separated → performance friendly
- Documentation-first → safe OSS collaboration

---

## Contributor Rule of Thumb

If your change:

- touches geometry → it belongs in **core**
- touches drawing → it belongs in **rn**
- touches gestures → split math (core) and UI (rn)

When in doubt, ask before adding abstraction.

---

rn-sane-charts favors **clarity, predictability, and maintainability** over cleverness.
