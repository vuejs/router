import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        extends: './packages/router/vitest.config.ts',
        test: {
          name: 'router',
          root: './packages/router',

          // TODO: migrate browser specific tests to e2e or to browser mode
          // exclude: ['./__tests__/history/html5.spec.ts'],
        },
      },

      // {
      //   extends: './packages/router/vitest.config.ts',
      //   test: {
      //     name: 'router:browser',
      //     root: './packages/router',
      //
      //     include: ['./__tests__/history/html5.spec.ts'],
      //     typecheck: {
      //       enabled: false,
      //     },
      //     browser: {
      //       enabled: true,
      //       provider: 'playwright',
      //       // https://vitest.dev/guide/browser/playwright
      //       instances: [
      //         { browser: 'chromium' },
      //         // { browser: 'firefox' },
      //         // { browser: 'webkit' },
      //       ],
      //     },
      //   },
      // },
    ],
  },
})
