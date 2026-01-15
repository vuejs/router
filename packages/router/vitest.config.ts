import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
    __BROWSER__: true,
  },
  plugins: [Vue()],

  test: {
    // open: false,
    include: ['__tests__/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: [
      'src/**/*.test-d.ts',
      // Playwright handles HMR E2E tests
      'e2e/unplugin/hmr/**',
    ],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test-d.ts',
        'src/**/*.spec.ts',
        // '/node_modules/',
        'src/index.ts',
        'src/devtools.ts',
        'src/experimental/index.ts',
        'src/**/test-utils.ts',
        // Unplugin entry points
        'src/unplugin/index.ts',
        'src/unplugin/vite.ts',
        'src/unplugin/webpack.ts',
        'src/unplugin/rollup.ts',
        'src/unplugin/rolldown.ts',
        'src/unplugin/esbuild.ts',
        'src/unplugin/types.ts',
        // Volar
        'src/volar/**',
      ],
    },
    typecheck: {
      enabled: true,
      checker: 'vue-tsc',
      // only: true,
      // by default it includes all specs too
      include: ['src/**/*.test-d.ts'],

      // tsconfig: './tsconfig.typecheck.json',
    },
    // projects: [
    //   {
    //     test: {
    //       name: 'router:browser',
    //       include: ['./__tests__/history/html5.spec.ts'],
    //       browser: {
    //         enabled: true,
    //         provider: 'playwright',
    //         // https://vitest.dev/guide/browser/playwright
    //         instances: [
    //           { browser: 'chromium' },
    //           // { browser: 'firefox' },
    //           // { browser: 'webkit' },
    //         ],
    //       },
    //     },
    //   },
    // ],
  },
})
