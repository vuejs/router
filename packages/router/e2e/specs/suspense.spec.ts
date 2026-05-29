import { test, expect, type Page } from '@playwright/test'

// The `#update-query` link renders the current fullPath as its text, so it can
// alias a static nav link's name (e.g. both read `/foo` while on `/foo`).
// Exclude it so nav-link lookups stay unambiguous; `exact` avoids `/foo`
// matching `/foo-async` and `/` matching everything.
const link = (page: Page, name: string) =>
  page
    .getByRole('link', { name, exact: true })
    .and(page.locator('a:not(#update-query)'))

test.describe('suspense', () => {
  test('suspense with guards', async ({ page }) => {
    await page.goto('/suspense/foo')
    await expect(page.getByRole('heading', { name: 'Suspense' })).toBeVisible()

    await link(page, '/foo').click()
    await expect(page.locator('#Foo')).toBeVisible()
    await page.locator('#update-query').click()
    await link(page, '/foo-async').click()
    await expect(page.locator('#FooAsync')).toBeVisible()
    await page.locator('#update-query').click()
    await link(page, '/foo').click()
    await expect(page.locator('#Foo')).toBeVisible()
    await page.locator('#update-query').click()
    await link(page, '/').click()

    await expect(page.locator('#logs')).toHaveText(
      [
        `Foo: setup:update /foo - /foo?n=1`,
        `Foo: setup:leave /foo?n=1 - /foo-async`,
        `FooAsync: setup:update /foo-async - /foo-async?n=1`,
        `FooAsync: setup:leave /foo-async?n=1 - /foo`,
        `Foo: setup:update /foo - /foo?n=1`,
        `Foo: setup:leave /foo?n=1 - /`,
      ].join('\n')
    )
  })
})
