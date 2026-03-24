# Publishing to npm (alpha / MVP)

This document is the **maintainer checklist** for shipping `@rn-sane-charts/core` and `@rn-sane-charts/rn` to the npm registry. External testers and app developers should **install from npm** (with a **dist-tag** such as `alpha`) rather than cloning the monorepo—see [GETTING_STARTED.md](GETTING_STARTED.md) and [README.md](../README.md).

## Why npm (not Git install) for feedback cohorts

- **Standard install path:** `pnpm add @rn-sane-charts/rn@alpha` (and `core` as a dependency).
- **Clear versioning** and lockfile-friendly installs.
- **No monorepo concepts** required for consumers (`workspace:*` is resolved at publish time).

Tarball testing from `pnpm pack` remains valid for internal QA; see [EXAMPLES_TARBALL_TESTING.md](EXAMPLES_TARBALL_TESTING.md).

## Prerequisites

1. **npm account** with permission to publish the **`@rn-sane-charts`** scope (create the org/scope on [npmjs.com](https://www.npmjs.com/) if needed).
2. **Automation token** (recommended): create an **Automation** granular access token on npm and add it to the GitHub repo as secret **`NPM_TOKEN`** for [`.github/workflows/publish.yml`](../.github/workflows/publish.yml).
3. **Version alignment:** keep **`packages/core/package.json`** and **`packages/rn/package.json`** `version` fields in sync for each release line (e.g. both `0.1.0`).

## What gets published

| Package | Default entry | React Native |
|--------|----------------|--------------|
| `@rn-sane-charts/core` | `dist/` (CJS + ESM + `.d.ts` from **tsup**) | `exports["."].react-native` → `src/` for Metro |
| `@rn-sane-charts/rn` | `lib/` (react-native-builder-bob) | `source` / `src` as today |

`core` runs **`prepublishOnly`** to build `dist/` before pack/publish (`dist/` is gitignored; the tarball always includes built JS).

## Manual publish (from a clean machine)

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm -r --filter @rn-sane-charts/core build
pnpm --filter @rn-sane-charts/rn run prepare   # bob → lib/

# Log in once: npm login
pnpm publish --filter @rn-sane-charts/core --access public --tag alpha --no-git-checks
pnpm publish --filter @rn-sane-charts/rn --access public --tag alpha --no-git-checks
```

- **`--tag alpha`:** consumers install with `@rn-sane-charts/rn@alpha` until you promote `latest`.
- **`--no-git-checks`:** only if you intentionally publish without a clean git state (prefer a clean tag-driven release in production).
- **Order:** always publish **core** first, then **rn** (pnpm rewrites the `workspace:*` dependency on `rn` to the published core version).

Dry-run locally:

```bash
pnpm pack --filter @rn-sane-charts/core
pnpm pack --filter @rn-sane-charts/rn
```

Generated `*.tgz` files are gitignored at the repo root.

## GitHub Actions

Workflow **[publish.yml](../.github/workflows/publish.yml)** (manual **workflow_dispatch**) runs tests, builds both packages, and publishes with a configurable **dist-tag** (default `alpha`). Configure **`NPM_TOKEN`** in repository secrets.

## Consumer install (alpha)

```bash
pnpm add @rn-sane-charts/rn@alpha @rn-sane-charts/core@alpha @shopify/react-native-skia
```

Pin the same tag on both packages during alpha so versions stay aligned.

## After publishing

- Update [GETTING_STARTED.md](GETTING_STARTED.md) / [README.md](../README.md) if the recommended tag or version range changes.
- Run the **external consumer validation** steps in [ROADMAP.md](ROADMAP.md) (fresh app, iOS/Android build).
