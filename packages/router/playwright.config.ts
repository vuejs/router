import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT) || 3000
const baseURL = `http://localhost:${PORT}`

export default defineConfig<{ playgroundName: string }>({
  testDir: './e2e',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // undefined => Playwright auto-scales to half the logical CPU cores. The HMR
  // projects need a single worker (see comment below); CI runs them in their
  // own `playwright test --workers=1` invocation, so they don't constrain the
  // worker count of the behavioural e2e specs.
  workers: undefined,
  reporter: [
    // for console logs
    ['list'],
    // to debug
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  // Vite dev server hosting the example apps driven by the specs in e2e/specs.
  // The HMR projects below spin up their own per-worker server instead.
  webServer: {
    command: 'node e2e/devServer.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    // Behavioural e2e specs run across every engine Playwright ships with, to
    // keep browser coverage as wide as possible.
    {
      name: 'chromium',
      testMatch: 'specs/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: 'specs/**/*.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: 'specs/**/*.spec.ts',
      use: { ...devices['Desktop Safari'] },
    },

    // unplugin HMR tests: they manage their own Vite dev server per worker
    // (see e2e/unplugin/hmr/fixtures/vite-server.ts) so they don't use the
    // shared webServer/baseURL above.
    {
      name: 'hmr-routes',
      testMatch: 'unplugin/hmr/routes/hmr.spec.ts',
      // no retries because we have a setup
      retries: 0,
      use: {
        ...devices['Desktop Safari'],
        playgroundName: 'routes',
      },
    },
    {
      name: 'hmr-resolver',
      testMatch: 'unplugin/hmr/resolver/hmr.spec.ts',
      retries: 0,
      use: {
        ...devices['Desktop Safari'],
        playgroundName: 'resolver',
      },
    },
  ],
})
