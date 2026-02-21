# DESIGN_GUIDE.md

rn-sane-charts is intentionally opinionated. This guide documents the design decisions behind the library’s defaults and provides practical UX rules that help a developer (often the designer in small teams) ship charts that look modern and remain readable on mobile.

> This guide is **policy + rationale**. For hands-on usage (first render, props, theming overrides, interaction wiring, streaming inputs), see: `docs/USER_GUIDE.md`.

## Table of contents

- [How to use this guide](#how-to-use-this-guide)
- [Chart chooser](#chart-chooser)
- [Color and theming](#color-and-theming)
- [Related implementation docs](#related-implementation-docs)
- [References](#references)

---

## How to use this guide

- If you’re deciding **which chart** to use: start with [Chart chooser](#chart-chooser).
- If your charts “look like old Excel”: start with [Color and theming](#color-and-theming).
- If you want to **implement** overrides or interactions: jump to [Related implementation docs](#related-implementation-docs).

---

## Chart chooser

For most business/product dashboards, the “basic” charts win because they’re easiest to read and hardest to misinterpret—especially on small screens. This section is a **1-page decision guide** you can apply quickly.

### Pick the chart by the user’s question (Option A)

| If the user’s question is… | Use | Avoid | Notes |
| --- | --- | --- | --- |
| **“How does it change over time / across an ordered sequence?”** | **Line** (default) / **Area** (if magnitude emphasis matters) | Bar (unless it’s categories), stacked area (unless carefully justified) | Line is the safest default for trends. Area is fine when you truly want to emphasize “amount,” but stacking can make comparisons harder. |
| **“Which category is bigger / what’s the ranking?”** | **Bar** | Line/area for unordered categories | Bar charts are the most broadly readable comparison tool and adapt well to responsive layouts. Use **horizontal bars** when labels are long. |
| **“Are these variables related / clusters / outliers?”** | **Scatter** | Line (unless x is ordered), area | Use scatter when relationships/outliers matter more than exact values at each point. Add a trend line only when it helps interpretation (and don’t imply causation). |
| **“What’s the distribution / skew / multiple peaks?”** | **Histogram** | Bar chart (unless values are truly categorical bins), line (unless a density curve is a deliberate choice) | Histograms are for distributions. **Binning changes the story**, so defaults and overrides matter. |

### Three rules that prevent the most common chart mistakes

1. **Bar charts start at zero**  
   Truncating the baseline often exaggerates differences. If you need to show small deltas, prefer alternate views (annotation, delta labels, or a different chart) instead of distorting the bar baseline.

2. **If labels don’t fit, use a rotation-first readability strategy**  
   Current implementation order:
   - try `0°`
   - then `45°`
   - then `90°`
   - apply tick skipping only when needed

   Guardrails:
   - reduce tick density when `90°` still feels cramped
   - shorten formatting (abbreviations, compact units)
   - use horizontal bars for long category labels
   - keep tap-to-inspect for exact values

3. **If you need more than ~6–8 series, the chart is asking for interaction or a different layout**  
   More colors is rarely the right answer. Use:
   - filtering (pick a subset)
   - highlight-on-select (focus one series)
   - small multiples (split into several small charts)
   - secondary encodings (markers/dashes) as a backup channel

### rn-sane-charts mapping

- **Line**: default for time-series trends and “what changed?”
- **Bar**: default for categorical comparisons and ranking
- **Scatter**: default for relationships, clusters, and outliers
- **Histogram**: default for distributions and shape (skew/spread/modality)
- **Area**: use when “filled magnitude” is part of the message; be cautious with stacking

---

## Color and theming

This section exists to eliminate the “old Excel palette” problem by making color **systematic**: clear roles, sensible series limits, and light/dark parity. The goal is **good usability** and a contemporary aesthetic—without claiming standards compliance.

### Principles (Apple-like, product UI oriented)

- Prefer **calm, modern hues** and avoid “default rainbow.”
- Ensure **light/dark parity** (don’t ship a palette that only works in one mode).
- Charts should be readable without forcing users to decode color first (clarity > decoration).

### Color roles (the modern upgrade)

Define colors by **role** rather than “pick a bunch of series colors”:

1. **Scaffolding**  
   Axes, gridlines, tick labels. Low emphasis; should never compete with data.

2. **Primary data**  
   The default/first series. Most prominent and most legible.

3. **Secondary data**  
   Additional series. Distinct, but slightly less prominent than primary.

4. **Focus / selection**  
   Highlighted series/point on interaction. Highest emphasis; everything else can fade.

5. **De-emphasis**  
   Muted series when another is focused. Purpose: reduce clutter and direct attention.

This role model keeps palettes small and clean while supporting many series via interaction.

Current implementation note:
- Theme roles are currently exposed as `background`, `frame`, `grid`, `axis`, and `series`.
- `focus` / `muted` are policy goals, but not first-class theme state tokens yet.

### Default palette strategy (Apple-like)

**Default categorical palette (current presets: 5 colors)**  
Current built-in light/dark presets ship 5 calm-but-saturated categorical colors.
Recommended working range remains 2-6 visible series for readability.

**Extended palette (up to 8)**  
Allow up to 8, but treat it as a “you probably need interaction” threshold.

**Avoid yellow as a default series color on light backgrounds**  
Yellow frequently becomes low-contrast for thin strokes/markers unless you add an outline or reserve it for highlights.

> Implementation note: Don’t bake “magic series colors” into rendering. Treat palette as a theme surface so apps can override cleanly.

### Light / dark parity rules (don’t just invert)

- **Scaffolding gets quieter in dark mode**  
  Gridlines and axis chrome should recede; data should stay prominent.
- **Data stays legible**  
  Don’t reduce stroke thickness / marker size in dark mode “because it looks bright.”
- **Selection must pop**  
  Focus/selection should increase prominence while others de-emphasize (opacity drop is typically cleaner than shifting all hues).

### Series count limits (sane defaults)

This is a usability constraint, not a palette problem.

Recommended behavior:

- **1 series**: use primary
- **2–6 series**: use default palette
- **7–8 series**: allowed, but strongly encourage interaction (focus + mute)
- **9+ series**: don’t solve with more colors  
  Use filtering, highlight-on-select, small multiples, and/or secondary encodings.

Suggested strategies when series count is high:

- **Highlight-on-select**: selecting one series increases opacity/weight; others fade.
- **Legend interaction**: prefer focus + de-emphasis; avoid hide/reveal as the primary behavior.
- **Secondary encodings** (when needed): dashed lines, marker shapes, point outlines.

Current implementation note:
- `legend.interactionMode` currently supports `"toggle"` and `"isolate"` (hide/reveal flows).
- Treat these as fallback tools for exceptional clutter, not as the default interaction model.

### Practical contrast guidance (usability-first)

Even if you don’t want to claim a standard, a simple benchmark prevents unreadable charts:

- **Meaningful graphical elements** (lines, bars, points, selection rings) should remain distinguishable against background and adjacent colors.
- A commonly used benchmark for non-text graphical elements is **~3:1** contrast. Treat this as a **design check**, not a certification claim.

### Recommended override model (simple, predictable)

Expose a small theme surface rather than dozens of knobs.

Current shipped surface:
- `background`
- `frame`
- `grid`
- `axis.tick`, `axis.line`
- `series.palette[]`, `series.strokeWidth`

Design target (not fully implemented yet):
- consolidated `scaffolding`
- first-class `state.focus` and `state.muted`

This supports “sane defaults for speed” while keeping overrides straightforward and coherent.

### Usability accessibility (without typography prescriptions)

- Don’t rely on color alone for meaning:
  - use markers and/or dashes for line/scatter when series count grows
  - prefer direct labels (e.g., end-of-line labels) when feasible; it reduces legend scanning on mobile
- Interaction should be additive:
  - tooltips/inspectors can provide precise values, but the chart must remain understandable without them

---

## Related implementation docs

If you’re looking for “how do I wire this up,” start here:

- **Hands-on usage and examples**: `docs/USER_GUIDE.md`
  - theming override layering (defaults → theme → per-series)
  - interaction props (snap modes, tooltips, highlight behavior)
  - streaming / live data patterns and transformations
  - practical validation workflow (e.g., accessibility-oriented theme checks)

---

## References

<!-- markdownlint-disable MD033 -->
<details>
<summary>Sources used to inform this guide (for further reading)</summary>

- Apple Human Interface Guidelines — Color  
  <https://developer.apple.com/design/human-interface-guidelines/color>
- Apple Human Interface Guidelines — Charting data  
  <https://developer.apple.com/design/human-interface-guidelines/charting-data>
- Nielsen Norman Group — Choosing Chart Types  
  <https://www.nngroup.com/articles/choosing-chart-types/>
- Datawrapper Academy — Chart types guidance  
  <https://academy.datawrapper.de/>
- W3C WCAG 2.1 — Understanding Non-text Contrast (SC 1.4.11)  
  <https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html>

</details>
<!-- markdownlint-enable MD033 -->
