import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000/hash/#'

// matches an `href` attribute that contains the given substring
function hrefContains(substring: string) {
  return new RegExp(substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
}

test.describe('hash', () => {
  test('navigating to links', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('#app > *').first()).toBeVisible()

    await expect(page.locator('li:nth-child(1) a')).toHaveAttribute(
      'href',
      hrefContains('#/')
    )
    await expect(page.locator('li:nth-child(2) a')).toHaveAttribute(
      'href',
      hrefContains('#/foo')
    )
    await expect(page.locator('li:nth-child(3) a')).toHaveAttribute(
      'href',
      hrefContains('#/bar')
    )
    await expect(page.locator('li:nth-child(4) a')).toHaveAttribute(
      'href',
      hrefContains('#/n/%C3%A9')
    )
    await expect(page.locator('li:nth-child(6) a')).toHaveAttribute(
      'href',
      hrefContains('#/unicode/%C3%A9')
    )

    await page.locator('li:nth-child(3) a').click()
    await expect(page).toHaveURL(BASE + '/bar')
    await expect(page.locator('.view')).toContainText('Bar')
    await page.locator('li:nth-child(2) a').click()
    await expect(page).toHaveURL(BASE + '/foo')
    await page.locator('li:nth-child(4) a').click()
    await expect(page).toHaveURL(BASE + '/n/%C3%A9')
    await expect(page.locator('#path')).toContainText('/n/%C3%A9')

    // the correctly encoded version
    await page.locator('li:nth-child(6) a').click()
    await expect(page).toHaveURL(BASE + '/unicode/%C3%A9')
    await expect(page.locator('#path')).toContainText('/unicode/%C3%A9')
    await expect(page.locator('#param')).toContainText('é')
    // the unencoded version, no check for the url because changes based on browser
    await page.locator('li:nth-child(5) a').click()
    await expect(page.locator('#param')).toContainText('é')

    // regular links should not break navigation
    await page.locator('li:nth-child(10) a').click()
    await expect(page).toHaveURL(BASE + '/foo')
    await expect(page.locator('#path')).toContainText('/foo')
    await expect(page.locator('.view')).toContainText('Foo')
  })

  test('initial navigation with search', async ({ page }) => {
    await page.goto('http://localhost:3000/hash/?code=auth#')
    await expect(page.locator('#app > *').first()).toBeVisible()
    await expect(page).toHaveURL('http://localhost:3000/hash/?code=auth#/')

    await page.goto('http://localhost:3000/hash/?code=auth#/foo')
    await expect(page).toHaveURL('http://localhost:3000/hash/?code=auth#/foo')
    // manually remove the search from the URL
    await expect(page.locator('#app > *').first()).toBeVisible()
    await page.evaluate(() => {
      window.history.replaceState(history.state, '', '/hash/#/foo')
    })
    await expect(page).toHaveURL(BASE + '/foo')
    await page.locator('li:nth-child(3) a').click()
    await expect(page).toHaveURL(BASE + '/bar')
    await page.goBack()
    await expect(page).toHaveURL(BASE + '/foo')

    // with slash between the pathname and search
    await page.goto('http://localhost:3000/hash/?code=auth#')
    await expect(page.locator('#app > *').first()).toBeVisible()
    await expect(page).toHaveURL('http://localhost:3000/hash/?code=auth#/')
  })

  test('encoding on initial navigation', async ({ page }) => {
    await page.goto(BASE + '/unicode/%C3%A9')
    // navigation to unencoded value
    await expect(page).toHaveURL(BASE + '/unicode/%C3%A9')
    await expect(page.locator('#path')).toContainText('/unicode/%C3%A9')
    await expect(page.locator('#param')).toContainText('é')
  })

  test('manual hash change to trigger redirect', async ({ page }) => {
    await page.goto(BASE + '/')
    await expect(page.locator('#app > *').first()).toBeVisible()
    await expect(page.locator('.view')).toContainText('home')

    await page.evaluate(() => {
      window.location.hash = '#/redirect'
    })
    await expect(page.locator('.view')).toContainText('Foo')
    await expect(page).toHaveURL(BASE + '/foo')
  })
})
