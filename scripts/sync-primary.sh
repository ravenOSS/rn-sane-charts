#!/usr/bin/env bash
set -euo pipefail

PRIMARY_ROOT="/Users/blackbird/Dropbox/MBP_Projects/dataviz/rn-sane-charts"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ "$ROOT" = "$PRIMARY_ROOT" ]; then
  echo "Already in primary checkout: $ROOT"
  exit 0
fi

echo "Syncing worktree changes to primary checkout..."
mkdir -p "${PRIMARY_ROOT}/scripts"

cp -f "${ROOT}/scripts/ios-start.sh" "${PRIMARY_ROOT}/scripts/ios-start.sh"
cp -f "${ROOT}/scripts/sync-primary.sh" "${PRIMARY_ROOT}/scripts/sync-primary.sh"
chmod +x "${PRIMARY_ROOT}/scripts/ios-start.sh" "${PRIMARY_ROOT}/scripts/sync-primary.sh"

mkdir -p "${PRIMARY_ROOT}/packages/examples"
cp -f "${ROOT}/packages/examples/package.json" "${PRIMARY_ROOT}/packages/examples/package.json"
cp -f "${ROOT}/packages/examples/app.json" "${PRIMARY_ROOT}/packages/examples/app.json"
cp -f "${ROOT}/pnpm-lock.yaml" "${PRIMARY_ROOT}/pnpm-lock.yaml"

node - <<'NODE'
const fs = require('fs');
const path = '/Users/blackbird/Dropbox/MBP_Projects/dataviz/rn-sane-charts/package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['ios:start'] = 'bash ./scripts/ios-start.sh';
pkg.scripts['sync:primary'] = 'bash ./scripts/sync-primary.sh';
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
NODE

echo "Primary checkout updated."
echo "Next: cd \"${PRIMARY_ROOT}\" && pnpm ios:start"
