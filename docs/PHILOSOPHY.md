# Philosophy

This document is the primary decision guide for `rn-sane-viz`.

Read it before proposing features, API changes, or new visualization behavior.
When a contribution conflicts with this document, this document wins until the
maintainers deliberately revise it.

## Why the Project Exists

React Native teams need charts that communicate business data clearly on small
screens. They do not need to become visualization designers, nor do they need a
library that asks them to configure every margin, tick, color, legend, and
interaction before a usable chart appears.

`rn-sane-viz` exists to own those recurring design decisions. Developers
describe their data and what the chart should communicate. The library handles
layout, defaults, and mobile interaction so charts remain readable and
consistent across a dashboard.

## What Problems It Solves

`rn-sane-viz` is built around problems that show up repeatedly in mobile
business apps:

- Charts that look unfinished until many props are tuned.
- Labels that collide, clip, or force unreadable density.
- Legends that cover the plot or require manual placement.
- Touch targets and tooltips that feel designed for a mouse.
- Dashboards where every chart has a slightly different visual language.
- Libraries that expand endlessly, leaving each team to invent its own
  standards.

The intended outcome is a smaller learning surface and fewer per-chart design
decisions, not maximum visual variety.

## Design Philosophy

### Opinionated over configurable

Defaults are part of the product. A chart should look deliberate immediately
after installation. Configuration should refine a good result, not rescue an
incomplete one.

### Consistency over novelty

Shared layout rules, themes, and interaction patterns matter more than adding
another specialized chart type. A coherent dashboard is more valuable than a
large catalog of one-off visuals.

### Infer before exposing

When behavior can be inferred reliably—spacing, tick density, label rotation,
legend placement, focus treatment—prefer inference. A new public option is a
permanent teaching and maintenance cost.

### Readability over density

Showing less information is acceptable when the remaining information is easier
to understand. Collision avoidance, tick skipping, and adaptive layout are
features, not compromises.

### Mobile-first interaction

Tap, scrub, responsive sizing, and finger-friendly hit areas are core behavior.
Desktop conventions are not the default reference model.

## API Philosophy

The public API should stay small enough that a developer can keep it in their
head.

- Prefer composition of a few chart primitives over deep configuration trees.
- Prefer shared props that behave consistently across chart types.
- Prefer improving a default over adding a prop for one edge case.
- Prefer app-level composition when a need is specific to one product.
- Reject API growth that exists mainly to match a competitor’s surface area.

A change that solves one application’s requirements but adds permanent API
surface for everyone else is the wrong tradeoff for this library.

## Visualization Philosophy

Visualization choices should favor clarity for operational and product
questions:

- Trends over time → line or area.
- Category comparison and ranking → bar.
- Relationship, clusters, outliers → scatter.
- Distribution shape → histogram.

The library’s job is to make those choices look professional by default:

- No clipped labels.
- No overlapping ticks when rotation or skipping can prevent it.
- Bar charts default to a zero baseline.
- Legends stay outside the plot.
- Tooltips avoid obscuring the selected data when practical.
- Light and dark themes remain coherent.

Beauty here means readable hierarchy, calm color, and predictable layout—not
decorative effects.

## Business-First Focus

`rn-sane-viz` prioritizes business dashboards: revenue, usage, conversion,
throughput, targets, comparisons, and similar operational questions.

That focus implies:

- A small set of common chart types is enough for most product and ops UIs.
- Annotations, reference lines, and KPI helpers may be more valuable than rare
  chart forms.
- Exact scientific plotting, exploratory analysis for researchers, and
  financial trading charts are not the center of gravity.

If a proposed feature mainly serves a specialized domain, it should usually
live in the application—or in a library built for that domain.

## Things Deliberately Excluded

The following are intentionally out of scope unless the maintainers revise this
philosophy:

- Web rendering as a primary target.
- A large “chart zoo” of uncommon or highly specialized chart types.
- Exhaustive mark-level customization for every visual detail.
- Zoom, brush, and complex exploratory interaction suites in early releases.
- Data fetching, parsing, streaming, or table components.
- Features that exist only to satisfy one app’s workflow.

If your use case depends on those capabilities, implementing them in the
application—or choosing a more configurable library—will usually be the better
fit. Keeping this boundary lets `rn-sane-viz` stay coherent and predictable.

## Long-Term Vision

Over time, `rn-sane-viz` should become the React Native library teams reach for
when they want trustworthy business visualization with minimal setup:

1. Stable branding, documentation, and API semantics.
2. A hardened core set of business charts with shared defaults.
3. Strong automatic layout: spacing, labels, legends, responsiveness, and axis
   density.
4. Business helpers that fit the small API: targets, reference lines, moving
   averages, annotations, and KPI-oriented patterns.
5. Advanced visualization only after the earlier layers are reliable.

Success is not measured by how many chart types exist. It is measured by how
quickly developers can ship readable, consistent dashboard charts—and how rarely
they need to fight the library to do so.

## How to Use This Document

- Contributors and agents: treat this as the first filter for scope decisions.
- Reviewers: reject changes that expand configuration without improving shared
  defaults.
- Users evaluating the library: use this document to decide whether the
  opinionated tradeoff matches your needs.

Related reading:

- [README](../README.md)
- [Design Guide](DESIGN_GUIDE.md)
- [Contributing](../CONTRIBUTING.md)
- [AGENTS.md](../AGENTS.md)
- [Product requirements](PRD.md)
