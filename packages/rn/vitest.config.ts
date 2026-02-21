import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@rn-sane-charts/core': resolve(__dirname, '../core/src/index.ts'),
      'react-native': resolve(__dirname, 'src/__tests__/mocks/react-native.ts'),
      '@shopify/react-native-skia': resolve(
        __dirname,
        'src/__tests__/mocks/react-native-skia.ts'
      ),
    },
  },
});
