# rn-sane-viz Repositioning Sprint (Codex Guide)

## Purpose

This document is the authoritative guide for Codex operating within
Cursor to reposition the project from a chart library into an
opinionated React Native data visualization library.

This sprint is **documentation-first**. Do **not** implement new
visualization features unless they are required to support documentation
examples or repository restructuring.

## Terminal Execution

Use a maximum foreground timeout of **20 seconds** for terminal or shell
commands by default. If a command genuinely requires a longer foreground
timeout, explain why before running it. Prefer background execution for
long-running commands.

------------------------------------------------------------------------

# Primary Objectives

1.  Rename the project from **rn-sane-charts** to **rn-sane-viz**.
2.  Reposition the project around opinionated visualization rather than
    feature count.
3.  Rewrite documentation to communicate philosophy before
    implementation.
4.  Replace the feature-driven roadmap with a developer-experience
    roadmap.
5.  Produce GitHub issues/TODOs aligned with the new direction.

------------------------------------------------------------------------

# Guiding Principles

Every change should reinforce these principles.

-   Opinionated over configurable
-   Excellent defaults over endless options
-   Business dashboards before scientific visualization
-   Mobile-first
-   Beautiful immediately after installation
-   Configuration should be additive, not mandatory
-   API simplicity is a feature
-   Automatic layout wherever practical
-   Consistency is more important than feature count

When uncertain, choose the solution that removes configuration rather
than adding it.

------------------------------------------------------------------------

# Sprint Tasks

## Task 1 --- Repository Rename

Rename:

    rn-sane-charts

to

    rn-sane-viz

Update:

-   README
-   package names
-   package.json
-   workspace references
-   npm scope
-   installation examples
-   import examples
-   badges
-   CI references
-   GitHub links
-   release workflow
-   documentation titles

Create a checklist of every changed reference.

------------------------------------------------------------------------

## Task 2 --- Rewrite README

Structure:

-   Vision
-   Why this project exists
-   Why another visualization library?
-   Philosophy
-   Features
-   Quick Start
-   Example
-   Comparison with existing libraries
-   Roadmap
-   Contributing

Avoid long API reference sections.

The README should explain **why** before **how**.

------------------------------------------------------------------------

## Task 3 --- Create PHILOSOPHY.md

This becomes the project's guiding document.

Suggested sections:

-   Why the project exists
-   What problems it solves
-   Design philosophy
-   API philosophy
-   Visualization philosophy
-   Business-first focus
-   Things deliberately excluded
-   Long-term vision

Every contributor should read this first.

------------------------------------------------------------------------

## Task 4 --- Rewrite DESIGN_GUIDE.md

Focus on principles rather than implementation.

Include:

-   sensible defaults
-   typography
-   spacing
-   accessibility
-   themes
-   responsiveness
-   color philosophy
-   animation philosophy

------------------------------------------------------------------------

## Task 5 --- Rewrite ARCHITECTURE.md

Describe layers such as:

-   Public API
-   Layout Engine
-   Rendering
-   Themes
-   Formatting
-   Statistics
-   Interaction
-   Skia integration

Explain responsibilities and design intent.

------------------------------------------------------------------------

## Task 6 --- Rewrite USER_GUIDE.md

Teach users:

-   choosing the correct chart
-   using defaults
-   when to customize
-   dashboard best practices
-   responsive layouts

Avoid exhaustive prop documentation.

------------------------------------------------------------------------

## Task 7 --- Rewrite CONTRIBUTING.md

State contributor expectations.

Examples:

-   Defaults before options
-   Simplicity before flexibility
-   No new chart types without roadmap approval
-   Backward compatibility matters
-   Documentation accompanies every feature

------------------------------------------------------------------------

## Task 8 --- Rewrite AGENTS.md

Provide explicit guidance for AI coding agents.

Examples:

-   Prefer removing props to adding props.
-   Infer behaviour whenever possible.
-   Preserve API consistency.
-   Prioritize developer experience.
-   Do not copy competitors blindly.
-   Benchmark before introducing complexity.

------------------------------------------------------------------------

## Task 9 --- Replace the Roadmap

Remove roadmap items that are simply lists of chart types.

Replace with milestones.

### Foundation

-   branding
-   docs
-   architecture
-   API stabilization

### Core Charts

-   Line
-   Area
-   Bar
-   Grouped Bar
-   Stacked Bar
-   Scatter
-   Pie
-   Donut

### Layout Intelligence

-   automatic spacing
-   automatic label avoidance
-   responsive layout
-   axis density
-   legends

### Business Features

-   reference lines
-   targets
-   moving averages
-   KPI helpers
-   annotations

### Advanced Visualizations

Only after previous milestones are complete.

------------------------------------------------------------------------

## Task 10 --- Competitor Analysis

Document:

-   Victory Native XL
-   react-native-gifted-charts
-   React Native ECharts
-   React Native Chart Kit

For each include:

-   strengths
-   weaknesses
-   API complexity
-   performance
-   developer experience
-   ideas worth adopting
-   ideas intentionally rejected

------------------------------------------------------------------------

# TODO Creation

Create GitHub issues (or TODO markdown) grouped into:

-   Foundation
-   Documentation
-   Branding
-   Core Charts
-   Layout Engine
-   Themes
-   Formatting
-   Accessibility
-   Performance
-   Examples
-   Testing
-   Benchmarks

Each issue should contain:

-   objective
-   rationale
-   acceptance criteria
-   dependencies

------------------------------------------------------------------------

# Success Criteria

The sprint is complete when:

-   the repository consistently uses the new name
-   documentation reflects the new vision
-   philosophy is documented
-   roadmap is experience-driven
-   contributors have clear guidance
-   future implementation priorities are well defined

No significant feature work should occur until this sprint has been
completed.
