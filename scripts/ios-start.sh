#!/usr/bin/env bash
set -euo pipefail

PRIMARY_ROOT="/Users/blackbird/Dropbox/MBP_Projects/dataviz/rn-sane-charts"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DEVICE_NAME="${DEVICE_NAME:-iPhone 16 Pro Max}"
METRO_PORT="${METRO_PORT:-8081}"
METRO_LOG="${METRO_LOG:-$ROOT/metro.log}"
APP_ID="${APP_ID:-com.mtnkoder.examples}"
CLEAN_BUILD="${CLEAN_BUILD:-1}"
RESET_METRO="${RESET_METRO:-1}"
  

if [ "$ROOT" != "$PRIMARY_ROOT" ]; then
  echo "Not running in the primary checkout."
  echo "Current repo root: $ROOT"
  echo "Expected root:     $PRIMARY_ROOT"
  exit 1
fi

if [ -n "${DEVICE_UDID:-}" ]; then
  UDID="$DEVICE_UDID"
else
  UDID="$(python3 - <<'PY'
import json, subprocess, sys, os, re
name = os.environ.get("DEVICE_NAME", "iPhone 16 Pro Max")
data = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "--json"]))
devices = []
for runtime, items in data.get("devices", {}).items():
    for d in items:
        devices.append(d)
def normalize(s):
    return re.sub(r"\s+", " ", s.strip().lower())
target = normalize(name)
exact = [d for d in devices if normalize(d.get("name","")) == target]
if exact:
    print(exact[0]["udid"])
    sys.exit(0)
booted = [d for d in devices if d.get("state") == "Booted"]
if booted:
    print(booted[0]["udid"])
    sys.exit(0)
startswith = [d for d in devices if normalize(d.get("name","")).startswith(target)]
if startswith:
    print(startswith[0]["udid"])
    sys.exit(0)
sys.exit(1)
PY
)" || true
fi

if [ -z "${UDID:-}" ]; then
  echo "Simulator not found: $DEVICE_NAME"
  echo "Check available devices with: xcrun simctl list devices"
  echo "Or set DEVICE_UDID to target a specific simulator."
  exit 1
fi

if [ -n "${DEVICE_UDID:-}" ]; then
  echo "Using simulator UDID: $UDID"
else
  DEVICE_INFO="$(python3 - <<'PY'
import json, subprocess, os, sys
udid = os.environ.get("UDID")
data = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "--json"]))
for runtime, items in data.get("devices", {}).items():
    for d in items:
        if d.get("udid") == udid:
            print(f"{d.get('name')}|{d.get('state')}|{runtime}")
            sys.exit(0)
sys.exit(1)
PY
)" || true

  if [ -z "$DEVICE_INFO" ]; then
    echo "Simulator UDID not found: $UDID"
    exit 1
  fi

  DEVICE_ACTUAL_NAME="${DEVICE_INFO%%|*}"
  DEVICE_STATE="$(echo "$DEVICE_INFO" | cut -d'|' -f2)"
  DEVICE_RUNTIME="$(echo "$DEVICE_INFO" | cut -d'|' -f3)"

  if [ -n "${DEVICE_NAME:-}" ] && [ "$DEVICE_ACTUAL_NAME" != "$DEVICE_NAME" ]; then
    echo "Selected simulator does not match DEVICE_NAME."
    echo "Requested: $DEVICE_NAME"
    echo "Resolved:  $DEVICE_ACTUAL_NAME ($DEVICE_STATE, $DEVICE_RUNTIME)"
    echo "Set DEVICE_UDID to force a specific simulator."
    exit 1
  fi

  echo "Using simulator: $DEVICE_ACTUAL_NAME ($DEVICE_STATE, $DEVICE_RUNTIME)"
fi

open -a Simulator >/dev/null 2>&1 || true
xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1 || true

if [ "$CLEAN_BUILD" = "1" ]; then
  echo "Cleaning build artifacts..."
  rm -rf packages/examples/ios packages/examples/.expo
  rm -rf "${HOME}/Library/Developer/Xcode/DerivedData/examples-"*
  xcrun simctl uninstall "$UDID" "$APP_ID" >/dev/null 2>&1 || true
fi

if [ "$RESET_METRO" = "1" ]; then
  if lsof -nP -iTCP:"${METRO_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Stopping Metro on port ${METRO_PORT}..."
    lsof -nP -iTCP:"${METRO_PORT}" -sTCP:LISTEN -t | xargs -r kill
  fi
fi

if ! curl -fsS "http://localhost:${METRO_PORT}/status" >/dev/null 2>&1; then
  echo "Starting Metro on port ${METRO_PORT}..."
  CI=0 pnpm --dir packages/examples start --port "${METRO_PORT}" --clear >"${METRO_LOG}" 2>&1 &
  sleep 2
fi

echo "Building app for ${DEVICE_NAME}..."
set +e
export RCT_NEW_ARCH_ENABLED
pnpm --dir packages/examples exec expo run:ios -d "${DEVICE_NAME}" --no-bundler --no-build-cache
RUN_STATUS=$?
set -e

echo "Launching app directly on simulator..."
xcrun simctl launch "$UDID" "$APP_ID" >/dev/null 2>&1 || {
  echo "Failed to launch ${APP_ID} on simulator ${UDID}."
  exit 1
}

if [ "$RUN_STATUS" -ne 0 ]; then
  echo "expo run:ios exited with code $RUN_STATUS. Manual launch succeeded."
fi
