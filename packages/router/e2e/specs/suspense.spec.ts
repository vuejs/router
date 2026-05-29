import { test, expect } from '@playwright/test'

test.describe('suspense', () => {
  test('suspense with guards', async ({ page }) => {
    await page.goto('/suspense/foo')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator('#Foo')).toBeVisible()
    await page.locator('li:nth-child(4) a').click()
    await page.locator('li:nth-child(3) a').click()
    await expect(page.locator('#FooAsync')).toBeVisible()
    await page.locator('li:nth-child(4) a').click()
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator('#Foo')).toBeVisible()
    await page.locator('li:nth-child(4) a').click()
    await page.locator('li:nth-child(1) a').click()

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
