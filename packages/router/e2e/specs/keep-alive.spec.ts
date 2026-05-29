import { test, expect } from '@playwright/test'

test.describe('keep-alive', () => {
  test('preserves state and runs guards across history navigation', async ({
    page,
  }) => {
    await page.goto('/keep-alive/')
    await expect(page.getByRole('heading', { name: 'KeepAlive' })).toBeVisible()

    await expect(page.locator('#counter')).toHaveText('0')
    await page.getByRole('button', { name: 'Increment' }).click()
    await expect(page.locator('#counter')).toHaveText('1')

    await page.getByRole('link', { name: '/foo', exact: true }).click()
    await expect(page.locator('.view')).toContainText('foo')
    await page.getByRole('link', { name: '/', exact: true }).click()
    // the counter is kept alive
    await expect(page.locator('#counter')).toHaveText('1')

    await page.getByRole('link', { name: '/with-guards', exact: true }).click()
    await expect(page.locator('#enter-count')).toHaveText('1')
    await expect(page.locator('#update-count')).toHaveText('0')
    await page.getByRole('button', { name: 'Change query' }).click()
    await expect(page.locator('#enter-count')).toHaveText('1')
    await expect(page.locator('#update-count')).toHaveText('1')
    await page.goBack()
    await expect(page.locator('#update-count')).toHaveText('2')
    await expect(page.locator('#leave-count')).toHaveText('0')
    await page.goBack()
    await expect(page.locator('#counter')).toHaveText('1')
    await page.goForward()
    await expect(page.locator('#enter-count')).toHaveText('2')
    await expect(page.locator('#update-count')).toHaveText('2')
    await expect(page.locator('#leave-count')).toHaveText('1')
  })
})
