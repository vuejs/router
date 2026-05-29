import { test, expect, type Page } from '@playwright/test'
import { reloadKeepingState } from './utils'

// Clicking a link via Playwright's locator.click() scrolls the target into
// view, which would corrupt the scroll-position assertions this suite relies
// on. Dispatch the click through the DOM instead so the page does not
// auto-scroll.
async function clickLink(page: Page, selector: string) {
  await page.evaluate(
    sel => (document.querySelector(sel) as HTMLElement).click(),
    selector
  )
}

test.describe('scroll-behavior', () => {
  test('scroll behavior', async ({ page }) => {
    await page.goto('http://localhost:3000/scroll-behavior/')
    await expect(page.locator('#app > *').first()).toBeVisible()
    await expect(page.locator('li a')).toHaveCount(6)
    await expect(page.locator('.view')).toContainText('home')

    await page.evaluate(() => {
      window.scrollTo(0, 100)
    })
    await clickLink(page, 'li:nth-child(2) a')
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect(page.locator('.view')).toContainText('foo')
    await page.evaluate(() => {
      window.scrollTo(0, 200)
      window.history.back()
    })
    await expect(page.locator('.view.home')).toBeVisible()
    await expect(page.locator('.view')).toContainText('home')
    await expect
      .poll(() => page.evaluate(() => window.pageYOffset === 100), {
        message: 'restore scroll position on back',
      })
      .toBe(true)

    // scroll on a popped entry
    await page.evaluate(() => {
      window.scrollTo(0, 50)
      window.history.forward()
    })
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect(page.locator('.view')).toContainText('foo')
    await expect
      .poll(() => page.evaluate(() => window.pageYOffset === 200), {
        message: 'restore scroll position on forward',
      })
      .toBe(true)

    await page.evaluate(() => {
      window.history.back()
    })
    await expect(page.locator('.view.home')).toBeVisible()
    await expect(page.locator('.view')).toContainText('home')
    await expect
      .poll(() => page.evaluate(() => window.pageYOffset === 50), {
        message: 'restore scroll position on back again',
      })
      .toBe(true)
    await clickLink(page, 'li:nth-child(3) a')
    await expect(page.locator('.view.bar')).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => window.pageYOffset === 0), {
        message: 'scroll to top on new entry',
      })
      .toBe(true)

    await clickLink(page, 'li:nth-child(4) a')
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.getElementById('anchor')!.getBoundingClientRect().top < 1
          ),
        { message: 'scroll to anchor' }
      )
      .toBe(true)

    await clickLink(page, 'li:nth-child(5) a')
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.getElementById('anchor2')!.getBoundingClientRect().top <
              101
          ),
        { message: 'scroll to anchor with offset' }
      )
      .toBe(true)
    await clickLink(page, 'li:nth-child(6) a')
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.getElementById('1number')!.getBoundingClientRect().top <
              1
          ),
        { message: 'scroll to anchor that starts with number' }
      )
      .toBe(true)

    // go to /foo first
    await clickLink(page, 'li:nth-child(2) a')
    await expect(page.locator('.view.foo')).toBeVisible()
    await page.evaluate(() => {
      window.scrollTo(0, 150)
      // revisiting the same hash should scroll again
      ;(document.querySelector('li:nth-child(4) a') as HTMLElement).click()
    })
    await expect(page.locator('.view.bar')).toBeVisible()
    await page.evaluate(() => {
      window.scrollTo(0, 50)
      ;(document.querySelector('li:nth-child(4) a') as HTMLElement).click()
    })
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.getElementById('anchor')!.getBoundingClientRect().top < 1
          ),
        { message: 'scroll to anchor when the route is the same' }
      )
      .toBe(true)
    await page.evaluate(() => {
      history.back()
    })
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => window.pageYOffset === 150), {
        message:
          'restores previous position without intermediate history entry',
      })
      .toBe(true)
    await reloadKeepingState(page)
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => window.pageYOffset === 150), {
        message: 'restores scroll position when reloading',
      })
      .toBe(true)

    // going to an anchor entry, scrolling, then back then forward restores the position
    await page.evaluate(() => {
      ;(document.querySelector('li:nth-child(4) a') as HTMLElement).click()
    })
    await expect(page.locator('.view.bar')).toBeVisible()
    // at this point we scrolled to the anchor, scroll again somewhere else
    // and then go back
    await page.evaluate(() => {
      window.scrollTo(0, 100)
      window.history.back()
    })
    await expect(page.locator('.view.foo')).toBeVisible()
    await page.evaluate(() => {
      window.history.forward()
    })
    await expect(page.locator('.view.bar')).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => window.pageYOffset === 100), {
        message: 'scroll to stored position over anchor',
      })
      .toBe(true)

    // going again to a popped entry should not restore the saved position
    await page.evaluate(() => {
      ;(document.querySelector('li:nth-child(1) a') as HTMLElement).click()
    })
    await expect(page.locator('.view.home')).toBeVisible()
    await clickLink(page, 'li:nth-child(4) a')
    await expect(page.locator('.view.bar')).toBeVisible()
    // at this point we scrolled to the anchor, scroll again somewhere else
    // and then go back
    await page.evaluate(() => {
      window.scrollTo(0, 100)
      window.history.back()
    })
    await expect(page.locator('.view.home')).toBeVisible()
    // go to the same location again but without using history.forward
    await clickLink(page, 'li:nth-child(4) a')
    await expect(page.locator('.view.bar')).toBeVisible()
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.getElementById('anchor')!.getBoundingClientRect().top < 1
          ),
        { message: 'scroll to anchor' }
      )
      .toBe(true)

    await page.goto('http://localhost:3000/scroll-behavior/bar#anchor')
    await expect(page.locator('.view.bar')).toBeVisible()
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.getElementById('anchor')!.getBoundingClientRect().top < 1
          ),
        { message: 'scroll to anchor when directly navigating to it' }
      )
      .toBe(true)
  })
})
