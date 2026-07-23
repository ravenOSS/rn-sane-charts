# rn-sane-viz Rename Checklist

This checklist records the repository-wide rename from `rn-sane-charts` to
`rn-sane-viz`. The sprint guide retains the old name intentionally because it
documents the rename instruction itself.

## Repository content

- [x] Root package identity: `package.json`
- [x] Workspace lockfile references: `pnpm-lock.yaml`
- [x] Core package identity and metadata: `packages/core/package.json`
- [x] React Native package identity and metadata: `packages/rn/package.json`
- [x] Example package dependencies and scripts: `packages/examples/package.json`
- [x] Core source references: `packages/core/src/layout/measureTextTypes.ts`
- [x] Core source references: `packages/core/src/model/types.ts`
- [x] React Native source references: `packages/rn/src/Chart.tsx`
- [x] React Native source references: `packages/rn/src/context.tsx`
- [x] React Native source references: `packages/rn/src/types.ts`
- [x] React Native source references: `packages/rn/src/skia/measureTextAdaptor.ts`
- [x] React Native source references: `packages/rn/src/series/AreaSeries.tsx`
- [x] React Native source references: `packages/rn/src/series/BarSeries.tsx`
- [x] React Native source references: `packages/rn/src/series/GroupedBarSeries.tsx`
- [x] React Native source references: `packages/rn/src/series/LineSeries.tsx`
- [x] React Native source references: `packages/rn/src/series/ScatterSeries.tsx`
- [x] React Native source references: `packages/rn/src/series/StackedAreaSeries.tsx`
- [x] React Native source references: `packages/rn/src/series/StackedBarSeries.tsx`
- [x] React Native source references: `packages/rn/src/series/barGeometry.ts`
- [x] React Native source references: `packages/rn/src/series/dataLabels.ts`
- [x] React Native test references: `packages/rn/src/__tests__/index.test.tsx`
- [x] React Native test references: `packages/rn/src/series/barGeometry.test.ts`
- [x] React Native test references: `packages/rn/src/series/dataLabels.test.ts`
- [x] React Native tooling references: `packages/rn/tsconfig.json`
- [x] React Native tooling references: `packages/rn/vitest.config.ts`
- [x] Example app imports: `packages/examples/App.tsx`
- [x] Example app imports: `packages/examples/chartConfig.ts`
- [x] Example app imports: `packages/examples/perfHarness.ts`
- [x] Example app imports: `packages/examples/sampleDatasets.ts`
- [x] Example app tooling: `packages/examples/metro.config.js`
- [x] Example app tooling: `packages/examples/tsconfig.json`
- [x] Example performance script: `packages/examples/scripts/perf-harness.mjs`

## Documentation and community files

- [x] Root README branding, installation, imports, and links: `README.md`
- [x] README badges: verified absent (no badge URLs to update)
- [x] Contributor guide: `CONTRIBUTING.md`
- [x] Agent guide: `AGENTS.md`
- [x] Markdown link checking: `.markdownlint.yml`
- [x] API guide: `docs/API.md`
- [x] Architecture guide: `docs/ARCHITECTURE.md`
- [x] Design guide: `docs/DESIGN_GUIDE.md`
- [x] Tarball testing guide: `docs/EXAMPLES_TARBALL_TESTING.md`
- [x] Getting started demo directory name: `sane-viz-demo` in `docs/GETTING_STARTED.md`
- [x] Tarball test directory name: `sane-viz-tarball-test` in `docs/EXAMPLES_TARBALL_TESTING.md`
- [x] Performance baseline: `docs/PERF_BASELINE.md`
- [x] Product requirements: `docs/PRD.md`
- [x] Publishing guide: `docs/PUBLISHING.md`
- [x] Roadmap: `docs/ROADMAP.md`
- [x] User guide: `docs/USER_GUIDE.md`
- [x] Package README: `packages/rn/README.md`
- [x] Package contributor guide: `packages/rn/CONTRIBUTING.md`
- [x] Bug report template: `.github/ISSUE_TEMPLATE/bug_report.yml`
- [x] Community links: `.github/ISSUE_TEMPLATE/config.yml`

## Automation and release

- [x] CI package filters: `.github/workflows/ci.yml`
- [x] npm publish package filters and labels: `.github/workflows/publish.yml`

## Public API identifiers retained in Task 1

These exported type names still contain `Chart` and were intentionally left
unchanged to avoid a public API break during the package rename:

- `SaneChartTheme`
- `SaneChartFonts`

A follow-up branding/API pass may introduce `SaneVizTheme` / `SaneVizFonts`
with temporary deprecated aliases if desired.

## External operations

- [ ] Create the `@rn-sane-viz` npm organization/scope (currently returns
  “Scope not found”; local npm session is unauthenticated).
- [x] Rename the GitHub repository from `ravenOSS/rn-sane-charts` to
  `ravenOSS/rn-sane-viz`.
- [x] Update the local Git remote after the GitHub rename.
- [x] Verify repository links after the GitHub rename
  (`https://github.com/ravenOSS/rn-sane-viz` returns 200; old URL 301s).
- [ ] Rename the local checkout directory from `rn-sane-charts` to
  `rn-sane-viz` after closing tools that hold the current path.
- [ ] Publish `@rn-sane-viz/core` and `@rn-sane-viz/rn` under the new npm scope.
- [x] Confirm old npm packages were never publicly published
  (`@rn-sane-charts/core` and `@rn-sane-charts/rn` both 404); deprecation not
  required.
