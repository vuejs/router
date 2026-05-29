import { test, expect } from '@playwright/test'

// hash-mode base, resolved against `baseURL` from playwright.config.ts. The
// trailing `#` matters: the router needs a hash to parse.
const BASE = '/hash/#'

test.describe('hash', () => {
  test('navigating to links', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('.view')).toContainText('home')

    await expect(
      page.getByRole('link', { name: '/', exact: true })
    ).toHaveAttribute('href', /#\//)
    // `/foo` also matches `/foo (regular hash)`, so match exactly
    await expect(
      page.getByRole('link', { name: '/foo', exact: true })
    ).toHaveAttribute('href', /#\/foo/)
    await expect(page.getByRole('link', { name: '/bar' })).toHaveAttribute(
      'href',
      /#\/bar/
    )
    await expect(page.getByRole('link', { name: '/n/é' })).toHaveAttribute(
      'href',
      /#\/n\/%C3%A9/
    )
    await expect(
      page.getByRole('link', { name: '/unicode/é (correctly encoded)' })
    ).toHaveAttribute('href', /#\/unicode\/%C3%A9/)

    await page.getByRole('link', { name: '/bar' }).click()
    await expect(page).toHaveURL(BASE + '/bar')
    await expect(page.locator('.view')).toContainText('Bar')
    await page.getByRole('link', { name: '/foo', exact: true }).click()
    await expect(page).toHaveURL(BASE + '/foo')
    await page.getByRole('link', { name: '/n/é' }).click()
    await expect(page).toHaveURL(BASE + '/n/%C3%A9')
    await expect(page.locator('#path')).toContainText('/n/%C3%A9')

    // the correctly encoded version
    await page
      .getByRole('link', { name: '/unicode/é (correctly encoded)' })
      .click()
    await expect(page).toHaveURL(BASE + '/unicode/%C3%A9')
    await expect(page.locator('#path')).toContainText('/unicode/%C3%A9')
    await expect(page.locator('#param')).toContainText('é')
    // the unencoded version, no check for the url because changes based on browser
    await page
      .getByRole('link', {
        name: '/unicode/é (not properly encoded, fails on some browsers)',
      })
      .click()
    await expect(page.locator('#param')).toContainText('é')

    // regular links should not break navigation
    await page.getByRole('link', { name: '/foo (regular hash)' }).click()
    await expect(page).toHaveURL(BASE + '/foo')
    await expect(page.locator('#path')).toContainText('/foo')
    await expect(page.locator('.view')).toContainText('Foo')
  })

  test('initial navigation with search', async ({ page }) => {
    await page.goto('/hash/?code=auth#')
    await expect(page).toHaveURL('/hash/?code=auth#/')

    await page.goto('/hash/?code=auth#/foo')
    await expect(page).toHaveURL('/hash/?code=auth#/foo')
    // manually remove the search from the URL
    await page.evaluate(() => {
      window.history.replaceState(history.state, '', '/hash/#/foo')
    })
    await expect(page).toHaveURL(BASE + '/foo')
    await page.getByRole('link', { name: '/bar' }).click()
    await expect(page).toHaveURL(BASE + '/bar')
    await page.goBack()
    await expect(page).toHaveURL(BASE + '/foo')

    // with slash between the pathname and search
    await page.goto('/hash/?code=auth#')
    await expect(page).toHaveURL('/hash/?code=auth#/')
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
    await expect(page.locator('.view')).toContainText('home')

    await page.evaluate(() => {
      window.location.hash = '#/redirect'
    })
    await expect(page.locator('.view')).toContainText('Foo')
    await expect(page).toHaveURL(BASE + '/foo')
  })
})
