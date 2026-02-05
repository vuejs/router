import { defineConfig, devices } from '@playwright/test'

export default defineConfig<{ playgroundName: string }>({
  testDir: './e2e/unplugin/hmr',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // no retries because we have a setup
  retries: 0,
  // Each worker gets its own isolated temp folder
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    // for console logs
    ['list'],
    // to debug
    ['html'],
  ],
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'hmr-routes',
      testMatch: 'routes/hmr.spec.ts',
      use: {
        ...devices['Desktop Safari'],
        playgroundName: 'routes',
      },
    },
    {
      name: 'hmr-resolver',
      testMatch: 'resolver/hmr.spec.ts',
      use: {
        ...devices['Desktop Safari'],
        playgroundName: 'resolver',
      },
    },
  ],
})
