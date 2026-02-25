# EXAMPLES_TARBALL_TESTING.md

This guide is for junior developers testing `rn-sane-charts` with:

- the examples code in this repository
- local tarball packages (`.tgz`) instead of npm registry installs

Use this when packages are not yet published to npm.

This guide intentionally excludes Expo Go. `rn-sane-charts` depends on native modules (including Skia), so testing should use development builds (`expo run:ios` / `expo run:android`) for reliable results.

## Mac Quick Path (Fastest Route)

If you are on macOS and want first success quickly:

1. Install tools: Cursor, Node 20+, `pnpm`, Git, Xcode, Android Studio.
2. Open Cursor.
3. In Cursor, open terminal from `Terminal -> New Terminal`.
4. In that Cursor terminal, clone this repository into a new local folder:

```bash
git clone https://github.com/ravenOSS/rn-sane-charts.git rn-sane-charts
cd rn-sane-charts
```

5. In Cursor, select `File -> Open Folder` and open the cloned `rn-sane-charts` folder so files are visible in the sidebar.
6. In Cursor terminal, run:

```bash
pnpm install
pnpm --dir packages/examples ios
```

7. Confirm examples app launches and chart switching works.
8. From repo root, build tarballs:

```bash
pnpm --filter @rn-sane-charts/core pack
pnpm --filter @rn-sane-charts/rn pack
```

9. Create fresh app in a separate folder and install tarballs:

```bash
npx create-expo-app@latest sane-charts-tarball-test
cd sane-charts-tarball-test
pnpm add /ABSOLUTE/PATH/rn-sane-charts-core-0.1.0.tgz /ABSOLUTE/PATH/rn-sane-charts-rn-0.1.0.tgz
pnpm add @shopify/react-native-skia
```

10. Replace `App.tsx` with the minimal chart from this guide and run:

```bash
pnpm ios
```

If this works, continue with the full sections for Android checks and troubleshooting.

## 1. What You Will Do

You will:

1. Install required tools (including Cursor).
2. Run the examples app from this repo.
3. Create a fresh Expo app.
4. Install `rn-sane-charts` from `.tgz` files.
5. Confirm the fresh app builds and renders a chart.

## 2. Install Required Tools

Install these first:

- Cursor
- Node.js LTS (20+ recommended)
- `pnpm`
- Git
- Xcode (macOS, for iOS Simulator)
- Android Studio (for Android Emulator)

### Pre-Flight Checklist

Before setup, confirm:

- You have at least 20 GB free disk space.
- You have stable internet access.
- You can install software on this machine (admin access).
- For iOS testing: macOS + Xcode installed.
- For Android testing: Android Studio + at least one emulator image installed.
- You can run terminal commands from Cursor.

Checkpoint:

```bash
node -v
pnpm -v
git --version
```

All three commands must print versions.

## 3. Xcode Setup (iOS Simulator)

If you will test on iOS:

1. Open Xcode.
2. Complete first-launch prompts (license/components).
3. Open `Xcode -> Settings -> Platforms` and download at least one iOS runtime.
4. Open `Xcode -> Open Developer Tool -> Simulator`.
5. In Simulator app, open `File -> Open Simulator` and choose an iPhone model.
6. If no devices are available, go back to Xcode and open `Window -> Devices and Simulators`, then in `Simulators` add one (for example, iPhone 15/16).
7. In Simulator app, select `Device` and confirm the chosen model is booted.

Checkpoint:

- Simulator shows home screen.
- In terminal, `xcrun simctl list devices` shows at least one available iPhone simulator.

Project code changes required:

- None for normal simulator launch.
- If iOS build fails with missing native project files in a fresh Expo app, run:

```bash
npx expo prebuild
```

Then retry `pnpm ios`.

## 4. Android Studio Setup (Android Emulator)

If you will test on Android:

1. Open Android Studio.
2. Open `Settings -> Languages & Frameworks -> Android SDK`.
3. In `SDK Platforms`, install one recent Android API (for example API 34 or 35).
4. In `SDK Tools`, install:
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator
   - Android SDK Command-line Tools
5. Open `Device Manager`.
6. Create a new virtual device (for Apple Silicon, use an arm64 system image).
7. Start the emulator and wait for Android home screen.

Checkpoint:

- `adb devices` shows one emulator as `device`.

Project code changes required:

- Usually none.
- If SDK path errors occur, create `android/local.properties` in the test app:

```properties
sdk.dir=/Users/<your-user>/Library/Android/sdk
```

## 5. Open Project in Cursor

1. Open Cursor app.
2. In Cursor, open terminal from `Terminal -> New Terminal`.
3. In that Cursor terminal, clone the repository into a new local folder:

```bash
git clone https://github.com/ravenOSS/rn-sane-charts.git rn-sane-charts
cd rn-sane-charts
```

4. In Cursor, select `File -> Open Folder`.
5. Open the `rn-sane-charts` repository root so files appear in the left sidebar.
6. Use Cursor terminal for all remaining commands in this guide.

Checkpoint:

```bash
pwd
ls
```

You should see folders like `packages` and `docs`.

## 6. Install Monorepo Dependencies

From repo root:

```bash
pnpm install
```

Checkpoint:

```bash
pnpm -r typecheck
```

Typecheck should complete without errors.

## 7. Run the Examples App

From repo root:

```bash
pnpm --dir packages/examples start
```

In a second terminal, run one platform:

```bash
pnpm --dir packages/examples ios
```

or:

```bash
pnpm --dir packages/examples android
```

Checkpoint:

- App launches and shows chart type buttons (`Line`, `Area`, `Grouped Bar`, etc.).
- Tapping chart type buttons changes the chart.
- Legend mode buttons (`Focus`, `Toggle`, `Isolate`) respond.

Important:

- The examples app does not need `.tgz` tarballs.
- It runs directly from workspace packages (`@rn-sane-charts/core` and `@rn-sane-charts/rn`).

## 8. Prepare Tarball Files

From repo root:

```bash
pnpm --filter @rn-sane-charts/core pack
pnpm --filter @rn-sane-charts/rn pack
ls -lh rn-sane-charts-core-*.tgz rn-sane-charts-rn-*.tgz
```

Expected output includes:

- `rn-sane-charts-core-0.1.0.tgz`
- `rn-sane-charts-rn-0.1.0.tgz`

Alternative to local pack:

- Workshop lead can distribute prebuilt tarballs (zip/shared drive/release asset).
- Do not commit tarballs to the repo as source-controlled files.

## 9. Create Fresh Test App

From any parent folder (not inside this repo). This must be a separate new folder:

```bash
npx create-expo-app@latest sane-charts-tarball-test
cd sane-charts-tarball-test
```

Use default TypeScript template.

## 10. Install Tarballs into Fresh App

Install from absolute paths to the two `.tgz` files:

```bash
pnpm add /ABSOLUTE/PATH/rn-sane-charts-core-0.1.0.tgz /ABSOLUTE/PATH/rn-sane-charts-rn-0.1.0.tgz
pnpm add @shopify/react-native-skia
```

Example path on macOS:

```bash
pnpm add /Users/<you>/projects/rn-sane-charts/rn-sane-charts-core-0.1.0.tgz /Users/<you>/projects/rn-sane-charts/rn-sane-charts-rn-0.1.0.tgz
```

Checkpoint:

```bash
pnpm list @rn-sane-charts/core @rn-sane-charts/rn @shopify/react-native-skia
```

All three packages should appear.

## 11. Add a Minimal Chart to Fresh App

Replace `App.tsx` with:

```tsx
import React from 'react';
import { Platform, View } from 'react-native';
import { matchFont } from '@shopify/react-native-skia';
import { Chart, LineSeries, makeSkiaMeasureText } from '@rn-sane-charts/rn';
import type { Series } from '@rn-sane-charts/core';

const revenue: Series = {
  id: 'Revenue',
  data: Array.from({ length: 20 }, (_, i) => ({
    x: new Date(2026, 0, i + 1),
    y: 20 + Math.sin(i / 3) * 4 + i * 0.3,
  })),
};

export default function App() {
  const fontFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  });
  const font = React.useMemo(
    () => matchFont({ fontFamily, fontSize: 12 }),
    [fontFamily]
  );
  if (!font) return null;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
      }}
    >
      <Chart
        width={360}
        height={240}
        series={[revenue]}
        title="Tarball Test"
        subtitle="Fresh install verification"
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
        <LineSeries series={revenue} />
      </Chart>
    </View>
  );
}
```

## 12. Run Fresh App

```bash
pnpm start
```

Then run:

```bash
pnpm ios
```

or:

```bash
pnpm android
```

Checkpoint:

- Chart appears.
- No red-screen errors.
- Scrub/tap interaction works.

## 13. Troubleshooting

### `pnpm` command not found

Install:

```bash
npm install -g pnpm
```

### Android build cannot find SDK

Set Android SDK path in shell profile and restart terminal:

```bash
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"
```

### iOS build fails immediately

Open Xcode once, accept licenses, then retry `pnpm ios`.

### Bundling appears stuck for long time

Restart Metro:

```bash
pnpm start -- --clear
```

Then run platform command again.

## 14. What to Report Back

Share:

1. OS version and device/simulator used.
2. Which step failed.
3. Exact terminal error text.
4. Screenshot of error screen (if any).
5. Whether examples app and fresh tarball app both passed.
