# GETTING_STARTED.md

This guide is for developers getting familiar with using `rn-sane-charts` in a fresh React Native project.

This guide intentionally does **not** use Expo Go as the primary path.

Why:

- `rn-sane-charts` relies on native modules (including Skia).
- Expo Go can be limiting for native-library testing.
- A development build gives predictable behavior and fewer support surprises.

## 1. What You Will Build

By the end, you will:

1. Create a fresh Expo project.
2. Install `rn-sane-charts` + Skia.
3. Run on iOS Simulator or Android Emulator (or physical device).
4. Confirm chart rendering and interaction.

## 2. Platform Reality (Important)

- iOS Simulator requires macOS + Xcode.
- Android Emulator works on macOS/Windows/Linux with Android Studio.
- Cloud builds (EAS) can build from any OS, but local debugging still depends on your local setup.

Project-tested path today is macOS-first.

## 3. Prerequisites

Install these tools first:

1. Node.js LTS (20+ recommended)
2. `pnpm`
3. Git
4. Watchman (macOS recommended)
5. Xcode (for iOS simulator)
6. Android Studio + Android SDK + at least one emulator image (for Android)

### Checkpoint: Tooling

Run:

```bash
node -v
pnpm -v
git --version
```

Expected: all commands return a version, not “command not found”.

## 4. Create a Fresh Project

```bash
npx create-expo-app@latest sane-charts-demo
cd sane-charts-demo
```

Choose the default TypeScript template (recommended).

### Checkpoint: Project Created

Project folder contains `package.json`, `app.json`, and `App.tsx`.

## 5. Install Chart Dependencies

```bash
pnpm add @rn-sane-charts/rn @rn-sane-charts/core @shopify/react-native-skia
```

### Checkpoint: Dependencies Installed

Run:

```bash
pnpm list @rn-sane-charts/rn @rn-sane-charts/core @shopify/react-native-skia
```

Expected: all three packages appear.

## 6. Replace App.tsx With a Minimal Chart

Use this starter:

```tsx
import React from 'react';
import { Platform, View } from 'react-native';
import { matchFont } from '@shopify/react-native-skia';
import { Chart, LineSeries, makeSkiaMeasureText } from '@rn-sane-charts/rn';
import type { Series } from '@rn-sane-charts/core';

const series: Series[] = [
  {
    id: 'Revenue',
    data: Array.from({ length: 20 }, (_, i) => ({
      x: new Date(2026, 0, i + 1),
      y: 20 + Math.sin(i / 3) * 4 + i * 0.3,
    })),
  },
];

export default function App() {
  const fontFamily = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });
  const font = React.useMemo(() => matchFont({ fontFamily, fontSize: 12 }), [fontFamily]);
  if (!font) return null;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F7' }}>
      <Chart
        width={360}
        height={260}
        series={series}
        title="Revenue"
        subtitle="Last 20 days"
        xAxisTitle="Date"
        yAxisTitle="USD"
        interaction={{ enabled: true, snap: 'index', tooltip: true }}
        fonts={{
          measureText: makeSkiaMeasureText(font),
          xTickFont: { size: 12, family: fontFamily },
          yTickFont: { size: 12, family: fontFamily },
          titleFont: { size: 17, family: fontFamily, weight: 'semibold' },
          subtitleFont: { size: 12, family: fontFamily },
        }}
      >
        <LineSeries series={series[0]} color="#3A8DDE" />
      </Chart>
    </View>
  );
}
```

### Checkpoint: App Code Ready

No TypeScript import errors in your editor.

## 7. Run on iOS Simulator (macOS only)

1. Open Xcode once and accept license prompts.
2. Start a simulator from Xcode, or run directly:

```bash
pnpm ios
```

### Checkpoint: iOS Simulator

App opens and shows one line chart titled `Revenue`.

## 8. Run on Android Emulator

1. Open Android Studio.
2. Ensure SDK tools are installed:
   - Android SDK Platform
   - Android SDK Build-Tools
   - Android Emulator
   - One system image (arm64 for Apple Silicon Macs)
3. Create and boot an emulator.
4. Run:

```bash
pnpm android
```

### Checkpoint: Android Emulator

App installs and opens on emulator with the same chart.

## 9. Run on Physical Device (Development Build)

### iOS

```bash
pnpm ios --device
```

You may need Apple signing setup in Xcode.

### Android

1. Enable developer options + USB debugging.
2. Confirm device appears:

```bash
adb devices
```

3. Run:

```bash
pnpm android
```

### Checkpoint: Physical Device

App launches on device and chart responds to touch.

## 10. Common Problems and Fixes

### Problem: `command not found` for `adb` or `emulator`

Fix:

- Install Android SDK Platform Tools.
- Add SDK paths to your shell profile.

macOS example:

```bash
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"
```

Restart terminal and retry.

### Problem: `SDK location not found`

Fix: create `android/local.properties` in your app:

```properties
sdk.dir=/Users/<your-user>/Library/Android/sdk
```

### Problem: iOS build fails before app launch

Fixes:

1. Open `ios/*.xcworkspace` in Xcode and build once.
2. Accept Xcode license/tools prompts.
3. Re-run `pnpm ios`.

### Problem: app stuck at “Bundling …%”

Fixes:

1. Wait for first bundle (can be slow).
2. Restart Metro:

```bash
pnpm start -- --clear
```

3. Re-run platform command.

### Problem: native dependency mismatch after upgrades

Fixes:

1. Remove `node_modules` and lockfile, reinstall.
2. Rebuild native app:

```bash
pnpm install
pnpm ios
# or
pnpm android
```

## 11. Success Checklist

You are done when all are true:

1. App builds on at least one target (iOS or Android).
2. A chart is visible with title/axes/line.
3. Touch interaction shows tooltip/crosshair.
4. No red-screen runtime errors.

## 12. Next Step

After this first success, continue to:

- [USER_GUIDE.md](USER_GUIDE.md) for advanced usage in existing projects.
