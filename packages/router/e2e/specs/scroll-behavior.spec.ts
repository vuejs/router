import { test, expect, type Locator, type Page } from '@playwright/test'
import { reloadKeepingState } from './utils'

// Playwright's locator.click() scrolls the target into view, which would
// corrupt the scroll-position assertions this suite relies on. Trigger the
// element's own click() through the DOM instead so the page does not
// auto-scroll.
async function clickLink(link: Locator) {
  await link.evaluate(el => (el as HTMLElement).click())
}

// nav links render their `to` as their text; `exact` avoids `/bar` matching
// `/bar#anchor`, `/` matching everything, etc.
const link = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true })

const scrollY = (page: Page) => page.evaluate(() => window.scrollY)

const anchorTop = (page: Page, id: string) =>
  page.evaluate(
    sel => document.getElementById(sel)!.getBoundingClientRect().top,
    id
  )

test.describe('scroll-behavior', () => {
  test('scroll behavior', async ({ page }) => {
    await page.goto('/scroll-behavior/')
    await expect(
      page.getByRole('heading', { name: 'Scroll Behavior' })
    ).toBeVisible()
    await expect(page.locator('ul').getByRole('link')).toHaveCount(6)
    await expect(page.locator('.view')).toContainText('home')

    await page.evaluate(() => {
      window.scrollTo(0, 100)
    })
    await clickLink(link(page, '/foo'))
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect(page.locator('.view')).toContainText('foo')
    await page.evaluate(() => {
      window.scrollTo(0, 200)
      window.history.back()
    })
    await expect(page.locator('.view.home')).toBeVisible()
    await expect(page.locator('.view')).toContainText('home')
    await expect
      .poll(() => scrollY(page), {
        message: 'restore scroll position on back',
      })
      .toBe(100)

    // scroll on a popped entry
    await page.evaluate(() => {
      window.scrollTo(0, 50)
      window.history.forward()
    })
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect(page.locator('.view')).toContainText('foo')
    await expect
      .poll(() => scrollY(page), {
        message: 'restore scroll position on forward',
      })
      .toBe(200)

    await page.evaluate(() => {
      window.history.back()
    })
    await expect(page.locator('.view.home')).toBeVisible()
    await expect(page.locator('.view')).toContainText('home')
    await expect
      .poll(() => scrollY(page), {
        message: 'restore scroll position on back again',
      })
      .toBe(50)
    await clickLink(link(page, '/bar'))
    await expect(page.locator('.view.bar')).toBeVisible()
    await expect
      .poll(() => scrollY(page), {
        message: 'scroll to top on new entry',
      })
      .toBe(0)

    await clickLink(link(page, '/bar#anchor'))
    await expect
      .poll(() => anchorTop(page, 'anchor'), { message: 'scroll to anchor' })
      .toBeLessThan(1)

    await clickLink(link(page, '/bar#anchor2'))
    await expect
      .poll(() => anchorTop(page, 'anchor2'), {
        message: 'scroll to anchor with offset',
      })
      .toBeLessThan(101)
    await clickLink(link(page, '/bar#1number'))
    await expect
      .poll(() => anchorTop(page, '1number'), {
        message: 'scroll to anchor that starts with number',
      })
      .toBeLessThan(1)

    // go to /foo first
    await clickLink(link(page, '/foo'))
    await expect(page.locator('.view.foo')).toBeVisible()
    await page.evaluate(() => {
      window.scrollTo(0, 150)
    })
    // revisiting the same hash should scroll again
    await clickLink(link(page, '/bar#anchor'))
    await expect(page.locator('.view.bar')).toBeVisible()
    await page.evaluate(() => {
      window.scrollTo(0, 50)
    })
    await clickLink(link(page, '/bar#anchor'))
    await expect
      .poll(() => anchorTop(page, 'anchor'), {
        message: 'scroll to anchor when the route is the same',
      })
      .toBeLessThan(1)
    await page.evaluate(() => {
      history.back()
    })
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect
      .poll(() => scrollY(page), {
        message:
          'restores previous position without intermediate history entry',
      })
      .toBe(150)
    await reloadKeepingState(page)
    await expect(page.locator('.view.foo')).toBeVisible()
    await expect
      .poll(() => scrollY(page), {
        message: 'restores scroll position when reloading',
      })
      .toBe(150)

    // going to an anchor entry, scrolling, then back then forward restores the position
    await clickLink(link(page, '/bar#anchor'))
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
      .poll(() => scrollY(page), {
        message: 'scroll to stored position over anchor',
      })
      .toBe(100)

    // going again to a popped entry should not restore the saved position
    await clickLink(link(page, '/'))
    await expect(page.locator('.view.home')).toBeVisible()
    await clickLink(link(page, '/bar#anchor'))
    await expect(page.locator('.view.bar')).toBeVisible()
    // at this point we scrolled to the anchor, scroll again somewhere else
    // and then go back
    await page.evaluate(() => {
      window.scrollTo(0, 100)
      window.history.back()
    })
    await expect(page.locator('.view.home')).toBeVisible()
    // go to the same location again but without using history.forward
    await clickLink(link(page, '/bar#anchor'))
    await expect(page.locator('.view.bar')).toBeVisible()
    await expect
      .poll(() => anchorTop(page, 'anchor'), { message: 'scroll to anchor' })
      .toBeLessThan(1)

    await page.goto('/scroll-behavior/bar#anchor')
    await expect(page.locator('.view.bar')).toBeVisible()
    await expect
      .poll(() => anchorTop(page, 'anchor'), {
        message: 'scroll to anchor when directly navigating to it',
      })
      .toBeLessThan(1)
  })
})
