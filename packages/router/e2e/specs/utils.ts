import { type Page } from '@playwright/test'

/**
 * Reloads the page while preserving `history.state`.
 *
 * `page.reload()` wipes `history.state` in Playwright's bundled Firefox
 * (https://github.com/microsoft/playwright/issues/28264), which breaks any app
 * that restores itself from it on reload. An in-page `window.location.reload()`
 * keeps the state on every engine; we wait for the resulting `load` event so
 * later actions don't race the still-loading page.
 */
export async function reloadKeepingState(page: Page) {
  await Promise.all([
    page.waitForEvent('load'),
    page.evaluate(() => window.location.reload()),
  ])
}
