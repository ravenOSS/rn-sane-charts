# AGENTS.md — rn-sane-charts

## Purpose

**rn-sane-charts** is a **React Native-first**, **Skia-rendered** charting library delivering the **5 core business chart types** with **opinionated, readable, professional defaults** inspired by the philosophy of MetricsGraphics.

Primary promise:

* Charts look good by default
* Minimal API surface
* High performance & smooth interaction
* RN-optimized UX
* Codebase is readable, teachable, and contributor-friendly

This repository is designed for collaborative development using both human contributors and AI agents. This file defines architectural constraints, design intent, and code quality expectations.

---

## Core Philosophy (Non-Negotiable)

1. **Opinionated defaults > configuration**
2. **Small API > infinite flexibility**
3. **No chart zoo** — ship the “90%” charts
4. **Skia-only rendering** in MVP
5. **D3 is allowed for math only** (scales, ticks, paths). No DOM-style D3 usage.
6. “Lightweight” refers to:

   * Low cognitive load
   * Predictable performance
   * Stable memory behavior
   * Minimal required props

---

## 🔎 Inline Documentation Requirement (CRITICAL)

This project **requires high-quality inline documentation**.

### Why

rn-sane-charts is an OSS library. Contributors must be able to:

* Understand design intent
* Safely extend behavior
* Audit algorithms (especially layout & collision logic)
* Modify behavior (e.g., new label angles) without breaking invariants

### Required Standards

All non-trivial logic **must** include:

* A **function-level docblock** describing:

  * What the function does
  * Why the approach was chosen
  * Assumptions and invariants
* Inline comments for:

  * Non-obvious math (e.g., bounding box projections)
  * Heuristics (e.g., tick skipping strategy)
  * Performance tradeoffs
* If an algorithm makes layout or UX decisions, include:

  * “Human reasoning” behind the rule
  * What future contributors may want to change

### Example (expected quality)

```ts
/**
 * Resolves X-axis label rotation and tick skipping to avoid overlap.
 *
 * Strategy order:
 * 1. Try no rotation
 * 2. Try 45°
 * 3. Try 90°
 * 4. Apply tick skipping if needed
 *
 * This prioritizes readability over density and mirrors common charting conventions.
 * Future extension point: support additional angles (e.g., 30°, 60°) if UX testing justifies.
 */
```

Code without documentation for layout, geometry, or heuristics is considered **incomplete**.

---

## MVP Scope

### Chart Types

* Line
* Area (including stacked)
* Bar (grouped + stacked)
* Scatter
* Histogram

### Required Features

* X/Y axes with readable ticks
* Title & subtitle support
* Theme presets aligned with Tailwind-style tokens
* Tooltip (tap + scrub)
* Legend with smart placement
* Marker annotations
* Responsive layout with adaptive margins
* X-axis label rotation (0°, 45°, 90°)

### Non-Goals (MVP)

* Web renderer
* Candlestick/OHLC charts
* Zoom/brush
* Data table components (use TanStack Table)
* Full accessibility pass

---

## Architecture

### `@rn-sane-charts/core`

Pure logic:

* Data models
* Scales
* Layout engine
* Transforms (stacking, bins, downsample)
* Collision detection
* Hit-testing algorithms

Must remain deterministic, testable, and UI-framework-agnostic.

### `@rn-sane-charts/rn`

React Native layer:

* Skia rendering
* Components
* Gesture handling
* Tooltip state
* Theme presets

### Examples App

Expo app with gallery, perf tests, interactions, and table interop demo.

---

## Visualization Rules (Beauty Rules)

1. No clipped labels
2. No overlapping ticks (rotation + skipping allowed)
3. Bar charts default to zero baseline
4. Legend never covers plot
5. Tooltip avoids obscuring selected data
6. Touch targets ≥ 44px
7. Works in light and dark themes

---

## Performance Rules

* Smooth at:

  * 5k line points
  * 1k scatter points
* No per-frame allocations during gestures
* Spatial indexing for scatter hit-testing

---

## Agent Workflow

Agents must:

* Read `docs/PRD.md` and this file before coding
* Follow MVP scope strictly
* Add tests and demos with features
* Maintain inline documentation standards

Agents must not:

* Broaden scope
* Add dependencies casually
* Expose new customization APIs without PRD alignment

---

## Definition of Done

A task is done when:

* Acceptance criteria met
* Demo updated
* Tests added
* Performance unaffected
* Inline documentation meets required standard
