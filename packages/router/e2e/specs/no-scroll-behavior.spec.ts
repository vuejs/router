import { test, expect, type Locator, type Page } from '@playwright/test'
import { reloadKeepingState } from './utils'

const SCROLL_READS_KEY = '__scrollReads__'

/**
 * Replaces the `window.scrollX`/`window.scrollY` getters with spies that record
 * their call stack in `sessionStorage` (so reads happening while the page is
 * unloading survive a reload). Must run before any page script.
 */
async function installScrollReadSpy(page: Page) {
  await page.addInitScript(key => {
    const record = () => {
      try {
        const stacks: string[] = JSON.parse(sessionStorage.getItem(key) || '[]')
        stacks.push(new Error('scroll read').stack || 'no stack available')
        sessionStorage.setItem(key, JSON.stringify(stacks))
      } catch {
        // sessionStorage is unavailable on opaque origins like about:blank
      }
    }

    for (const prop of ['scrollX', 'scrollY'] as const) {
      const descriptor =
        Object.getOwnPropertyDescriptor(window, prop) ||
        Object.getOwnPropertyDescriptor(Window.prototype, prop)
      const original = descriptor?.get
      if (!original) continue
      Object.defineProperty(window, prop, {
        configurable: true,
        get() {
          record()
          return original.call(window)
        },
      })
    }
  }, SCROLL_READS_KEY)
}

const scrollReads = (page: Page) =>
  page.evaluate(
    key => JSON.parse(sessionStorage.getItem(key) || '[]') as string[],
    SCROLL_READS_KEY
  )

/**
 * Without `scrollBehavior`, the router has no reason to read the scroll
 * position: it neither saves nor restores it. Soft so every kind of navigation
 * is reported, not only the first one that reads the scroll position.
 */
async function expectNoScrollReads(page: Page, message: string) {
  expect.soft(await scrollReads(page), message).toEqual([])
  // only report each read once, on the navigation that caused it
  await page.evaluate(key => sessionStorage.removeItem(key), SCROLL_READS_KEY)
}

// the spies are on `window.scrollX`/`window.scrollY`, so the test itself must
// go through `document.documentElement` to not record its own reads
const scrollTo = (page: Page, top: number) =>
  page.evaluate(y => document.documentElement.scrollTo(0, y), top)

// Playwright's locator.click() scrolls the target into view, which would change
// the scroll position. Trigger the element's own click() through the DOM
// instead.
async function clickLink(link: Locator) {
  await link.evaluate(el => (el as HTMLElement).click())
}

const link = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true })

test.describe('no scroll behavior', () => {
  test.beforeEach(async ({ page }) => {
    await installScrollReadSpy(page)
  })

  test('does not compute the scroll position', async ({ page }) => {
    await page.goto('/no-scroll-behavior/')
    await expect(page.locator('.view.home')).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => history.scrollRestoration))
      .toBe('auto')
    await expectNoScrollReads(page, 'initial navigation')

    // push through a link
    await scrollTo(page, 100)
    await clickLink(link(page, '/foo'))
    await expect(page.locator('.view.foo')).toBeVisible()
    await expectNoScrollReads(page, 'push with a link')

    // push to a location with a hash
    await scrollTo(page, 200)
    await clickLink(link(page, '/bar#anchor'))
    await expect(page.locator('.view.bar')).toBeVisible()
    await expectNoScrollReads(page, 'push to a location with a hash')

    // replace through a link
    await clickLink(link(page, '/bar (replace)'))
    await expect(page.locator('.view.bar')).toBeVisible()
    await expectNoScrollReads(page, 'replace with a link')

    // programmatic push
    await page.evaluate(() => window.r.push('/foo'))
    await expect(page.locator('.view.foo')).toBeVisible()
    await expectNoScrollReads(page, 'router.push')

    // back
    await scrollTo(page, 300)
    await page.evaluate(() => window.history.back())
    await expect(page.locator('.view.bar')).toBeVisible()
    await expectNoScrollReads(page, 'history.back')

    // forward
    await page.evaluate(() => window.history.forward())
    await expect(page.locator('.view.foo')).toBeVisible()
    await expectNoScrollReads(page, 'history.forward')

    // router.go
    await page.evaluate(() => window.r.go(-1))
    await expect(page.locator('.view.bar')).toBeVisible()
    await expectNoScrollReads(page, 'router.go')

    // reload: the position is not saved on pagehide either
    await page.evaluate(() => window.r.push('/foo'))
    await expect(page.locator('.view.foo')).toBeVisible()
    await scrollTo(page, 400)
    await reloadKeepingState(page)
    await expect(page.locator('.view.foo')).toBeVisible()
    await expectNoScrollReads(page, 'reload')

    // back after a reload
    await page.evaluate(() => window.history.back())
    await expect(page.locator('.view.bar')).toBeVisible()
    await expectNoScrollReads(page, 'history.back after a reload')
  })
})
