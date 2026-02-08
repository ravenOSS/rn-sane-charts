# Contributing to rn-sane-charts

Thank you for contributing! This project aims to be a **high-quality, readable, and maintainable** React Native charting library. Please read this guide before submitting changes.

---

## Project Philosophy

rn-sane-charts values:

* Simplicity over flexibility
* Opinionated defaults over configuration overload
* Readability and documentation over cleverness
* Performance and smooth interaction on mobile

If a change increases complexity without clear user benefit, it likely does not belong in MVP.

---

## Inline Documentation Requirement

This project enforces a **documentation-first engineering culture**.

### All non-trivial logic must include

* Function-level docblocks explaining:

  * What the function does
  * Why the approach was chosen
  * Key assumptions and invariants
* Inline comments for:

  * Mathematical or geometric logic
  * Heuristic decisions
  * Performance tradeoffs
* Notes for future contributors where extension is likely

Pull requests that introduce layout, collision, or rendering logic **without documentation will not be accepted**.

---

## Scope Guidelines

Before contributing, verify your change fits within the current project scope:

### In Scope (MVP)

* Improvements to existing chart types
* Performance optimizations
* Readability and documentation improvements
* Bug fixes
* Visual polish that improves default behavior

### Out of Scope (MVP)

* New chart types beyond the defined 5
* Web support
* Data parsing/CSV utilities
* Major new configuration systems
* Financial charts
* Zooming/brush interactions

If you’d like to propose a future feature, open a discussion first.

---

## Development Workflow

1. Fork the repo and create a feature branch
2. Make focused changes (small PRs are preferred)
3. Ensure:

   * Tests pass
   * Example app demonstrates the change (if UI-related)
   * Performance is not degraded
4. Add or update documentation where needed
5. Submit a PR with a clear description

### Branch Policy for Runtime Experiments

Runtime validation tracks (for example, a temporary bare React Native app used to isolate infrastructure issues) should stay on dedicated branches and must not be merged into `main` unless they become part of the intended development workflow.

Current policy:

* `main` focuses on `packages/examples/` as the active app surface.
* `ExamplesBare` validation work remains isolated to its own branch.

---

## Definition of Done

A contribution is considered complete when:

* Acceptance criteria are satisfied
* Code includes required inline documentation
* Tests are added or updated
* Example app reflects UI changes
* No performance regressions are introduced

---

## Code Style

* TypeScript strict mode
* Prefer pure functions in core modules
* Avoid unnecessary dependencies
* Favor clarity over cleverness

---

## Questions?

If you are unsure whether something fits the philosophy or scope, open a discussion before investing time.

We appreciate your help making rn-sane-charts a dependable and approachable OSS project.
