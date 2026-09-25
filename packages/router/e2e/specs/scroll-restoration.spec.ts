import { expect, test, type Locator, type Page } from '@playwright/test'
import { reloadKeepingState } from './utils'

async function click(link: Locator) {
  await link.evaluate(element => (element as HTMLElement).click())
}

const link = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true })

const scrollY = (page: Page) => page.evaluate(() => window.scrollY)

// A killed page never fires pagehide, so later writes must be lost too
async function hideThenFreezeStorage(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
    delete (document as { visibilityState?: unknown }).visibilityState
    const storage = sessionStorage
    const frozen = new Proxy(storage, {
      get: (target, key) => {
        if (key === 'setItem' || key === 'removeItem' || key === 'clear') {
          return () => {}
        }
        const value = Reflect.get(target, key)
        return typeof value === 'function' ? value.bind(target) : value
      },
      set: () => true,
      deleteProperty: () => true,
    })
    Object.defineProperty(window, 'sessionStorage', { get: () => frozen })
  })
}

test.describe('scroll-restoration', () => {
  test('restores only after the destination component mounts', async ({
    page,
  }) => {
    await page.goto('/scroll-restoration/automatic-a')
    await expect(page.locator('.automatic-a')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 600))

    await click(link(page, 'neutral'))
    await expect(page.locator('.neutral')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 0))

    await click(link(page, 'automatic-b'))
    await expect(page.locator('.neutral.fade-leave-active')).toBeVisible()
    expect(await scrollY(page)).toBe(0)

    await expect(page.locator('.automatic-b')).toBeVisible()
    await expect.poll(() => scrollY(page)).toBe(600)
  })

  test('captures on pagehide and restores after reload', async ({ page }) => {
    await page.goto('/scroll-restoration/automatic-a')
    await expect(page.locator('.automatic-a')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 720))

    await reloadKeepingState(page)

    await expect(page.locator('.automatic-a')).toBeVisible()
    await expect.poll(() => scrollY(page)).toBe(720)
  })

  test('restores after leaving to another document and going back', async ({
    page,
  }) => {
    await page.goto('/scroll-restoration/automatic-a')
    await expect(page.locator('.automatic-a')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 640))

    await page.goto('/')
    await page.goBack()

    await expect(page.locator('.automatic-a')).toBeVisible()
    await expect.poll(() => scrollY(page)).toBe(640)
  })

  test('restores after the hidden page is killed', async ({ page }) => {
    await page.goto('/scroll-restoration/automatic-a')
    await expect(page.locator('.automatic-a')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 480))

    await hideThenFreezeStorage(page)
    await page.evaluate(() => window.scrollTo(0, 900))
    await reloadKeepingState(page)

    await expect(page.locator('.automatic-a')).toBeVisible()
    await expect.poll(() => scrollY(page)).toBe(480)
  })
})
