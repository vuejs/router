import { test, expect } from '@playwright/test'

// resolved against `baseURL` from playwright.config.ts
const BASE = '/multi-app'

test.describe('multi-app', () => {
  test('supports multiple apps mounted at the same time', async ({ page }) => {
    await page.goto(BASE + '/')
    await expect(page).toHaveURL(BASE + '/')

    const app1 = page.locator('#app-1')
    const app2 = page.locator('#app-2')
    const app3 = page.locator('#app-3')

    // mount multiple apps and expect to have one listener only
    await page.getByRole('button', { name: 'Mount App 1', exact: true }).click()
    await page.getByRole('button', { name: 'Mount App 2', exact: true }).click()
    await page.getByRole('button', { name: 'Mount App 3', exact: true }).click()
    await expect(app1.locator('.home')).toBeVisible()
    await expect(app2.locator('.home')).toBeVisible()
    await expect(app3.locator('.home')).toBeVisible()
    await expect(page.locator('#popcount')).toHaveText('1')
    await expect(page.locator('#guardcount')).toHaveText('1')

    // they should all be displaying the home page
    await expect(app1.locator('.home')).toContainText('Home')
    await expect(app1.getByRole('link', { name: 'Home' })).toContainClass(
      'router-link-exact-active'
    )
    await expect(app1.getByRole('link', { name: 'User 1' })).not.toContainClass(
      'router-link-active'
    )

    await expect(app2.locator('.home')).toContainText('Home')
    await expect(app2.getByRole('link', { name: 'Home' })).toContainClass(
      'router-link-exact-active'
    )
    await expect(app2.getByRole('link', { name: 'User 1' })).not.toContainClass(
      'router-link-active'
    )

    await expect(app3.locator('.home')).toContainText('Home')
    await expect(app3.getByRole('link', { name: 'Home' })).toContainClass(
      'router-link-exact-active'
    )
    await expect(app3.getByRole('link', { name: 'User 1' })).not.toContainClass(
      'router-link-active'
    )

    // navigation on app 1
    await app1.getByRole('link', { name: 'User 1' }).click()
    await expect(page.locator('#guardcount')).toHaveText('2')
    await expect(app1.locator('.user')).toContainText('User 1')
    await expect(app2.locator('.user')).toContainText('User 1')
    await expect(app3.locator('.user')).toContainText('User 1')

    // navigation on app 2
    await app2.getByRole('link', { name: 'User 2' }).click()
    await expect(page.locator('#guardcount')).toHaveText('3')
    await expect(app1.locator('.user')).toContainText('User 2')
    await expect(app2.locator('.user')).toContainText('User 2')
    await expect(app3.locator('.user')).toContainText('User 2')

    // should trigger the guard only once
    await page.goBack()
    await expect(page.locator('#guardcount')).toHaveText('4')

    // unmounting apps should pause guards
    // start by navigating 3 times
    await app1.getByRole('link', { name: 'Home' }).click()
    await app1.getByRole('link', { name: 'User 1' }).click()
    await app1.getByRole('link', { name: 'Home' }).click()
    await expect(page.locator('#guardcount')).toHaveText('7')
    await page.getByRole('button', { name: 'Unmount App 1' }).click()
    await page.getByRole('button', { name: 'Unmount App 2' }).click()
    await expect(page.locator('#guardcount')).toHaveText('7')
    await page.goBack()
    // one app is still mounted
    await expect(page.locator('#guardcount')).toHaveText('8')
    await page.getByRole('button', { name: 'Unmount App 3' }).click()
    await page.goBack()
    await expect(page.locator('#guardcount')).toHaveText('8')

    // mounting again should add the listeners again
    await page.getByRole('button', { name: 'Mount App 1', exact: true }).click()
    // the initial navigation
    await expect(page.locator('#guardcount')).toHaveText('9')
    await app1.getByRole('link', { name: 'User 1' }).click()
    await expect(page.locator('#guardcount')).toHaveText('10')
  })

  test('supports navigation guards context with multiple apps', async ({
    page,
  }) => {
    await page.goto(BASE + '/')
    await expect(page).toHaveURL(BASE + '/')

    const app1 = page.locator('#app-1')
    const app2 = page.locator('#app-2')

    // mount multiple apps and expect to have one listener only
    await page.getByRole('button', { name: 'Mount App 1', exact: true }).click()
    await expect(app1.locator('.home')).toContainText('Home')
    // toggle multiple times
    await app1.getByRole('link', { name: 'User 1' }).click()
    await expect(page.locator('#part-1 .count')).toHaveText('0')
    await app1.getByRole('link', { name: 'User 2' }).click()
    await expect(page.locator('#part-1 .count')).toHaveText('1')
    await page.getByRole('button', { name: 'Mount App 2', exact: true }).click()
    await expect(app2.locator('.user')).toContainText('User')
    await app1.getByRole('link', { name: 'User 1' }).click()
    // first one keeps updating
    await expect(page.locator('#part-1 .count')).toHaveText('2')
    // second app only updated once
    await expect(page.locator('#part-2 .count')).toHaveText('1')
    await page.getByRole('button', { name: 'Mount App 3', exact: true }).click()
  })
})
