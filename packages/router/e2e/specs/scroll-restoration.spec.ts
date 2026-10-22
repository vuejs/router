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

  // https://github.com/nuxt/nuxt/issues/36660
  test.describe('same page hash links', () => {
    const targetTop = (page: Page) =>
      page.evaluate(
        () => document.getElementById('target')!.getBoundingClientRect().top
      )

    test.beforeEach(async ({ page }) => {
      await page.goto('/scroll-restoration/anchors')
      await expect(page.locator('.anchors')).toBeVisible()
      await page.evaluate(() => window.scrollTo(0, 300))
    })

    test('restores the position on back after a native link', async ({
      page,
    }) => {
      await click(page.locator('#native-anchor'))
      await expect(page).toHaveURL(/\/anchors#target$/)
      await expect.poll(() => targetTop(page)).toBeLessThan(1)

      await page.evaluate(() => window.history.back())
      await expect(page).toHaveURL(/\/anchors$/)
      await expect.poll(() => scrollY(page)).toBe(300)
    })

    test('restores the position on forward after a native link', async ({
      page,
    }) => {
      await click(page.locator('#native-anchor'))
      await expect(page).toHaveURL(/\/anchors#target$/)
      await expect.poll(() => targetTop(page)).toBeLessThan(1)
      await page.evaluate(() => window.scrollTo(0, 2500))

      await page.evaluate(() => window.history.back())
      await expect(page).toHaveURL(/\/anchors$/)
      await page.evaluate(() => window.history.forward())
      await expect(page).toHaveURL(/\/anchors#target$/)
      await expect.poll(() => scrollY(page)).toBe(2500)
    })

    test('restores the position on back after a router-link', async ({
      page,
    }) => {
      await click(page.locator('#router-link-anchor'))
      await expect(page).toHaveURL(/\/anchors#target$/)
      await expect.poll(() => targetTop(page)).toBeLessThan(1)

      await page.evaluate(() => window.history.back())
      await expect(page).toHaveURL(/\/anchors$/)
      await expect.poll(() => scrollY(page)).toBe(300)
    })

    test('restores the position on back after a slow native link', async ({
      page,
    }) => {
      await page.goto('/scroll-restoration/anchors?slow')
      await expect(page.locator('.anchors')).toBeVisible()
      await page.evaluate(() => window.scrollTo(0, 300))

      await click(page.locator('#native-anchor'))
      await expect(page).toHaveURL(/\/anchors\?slow#target$/)
      await expect.poll(() => targetTop(page)).toBeLessThan(1)
      await page.waitForTimeout(300)

      await page.evaluate(() => window.history.back())
      await expect(page).toHaveURL(/\/anchors\?slow$/)
      await expect.poll(() => scrollY(page)).toBe(300)
    })

    test('restores a position set in the same task as a router-link click', async ({
      page,
    }) => {
      await page.evaluate(() => {
        window.scrollTo(0, 500)
        document.getElementById('router-link-anchor')!.click()
      })
      await expect(page).toHaveURL(/\/anchors#target$/)
      await expect.poll(() => targetTop(page)).toBeLessThan(1)

      await page.evaluate(() => window.history.back())
      await expect(page).toHaveURL(/\/anchors$/)
      await expect.poll(() => scrollY(page)).toBe(500)
    })
  })

  test('ignores scrolling of the leaving page during a transition', async ({
    page,
  }) => {
    await page.goto('/scroll-restoration/other')
    await expect(page.locator('.other')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 1000))
    await click(link(page, 'anchors'))
    await expect(page.locator('.anchors')).toBeVisible()
    await expect(page.locator('.fade-enter-active')).toHaveCount(0)
    await page.evaluate(() => window.scrollTo(0, 300))

    await click(link(page, 'other'))
    await expect(page.locator('.anchors.fade-leave-active')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 700))

    await expect(page.locator('.other')).toBeVisible()
    await expect.poll(() => scrollY(page)).toBe(1000)
  })

  test('captures when hidden and restores after reload', async ({ page }) => {
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
