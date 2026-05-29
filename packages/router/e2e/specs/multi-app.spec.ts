import { test, expect } from '@playwright/test'

// matches one class within a space-separated class attribute
const classRe = (cls: string) =>
  new RegExp(`(^|\\s)${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`)

const baseURL = 'http://localhost:3000/multi-app'

test.describe('multi-app', () => {
  test('supports multiple apps mounted at the same time', async ({ page }) => {
    await page.goto(baseURL + '/')
    await expect(page).toHaveURL(baseURL + '/')

    // mount multiple apps and expect to have one listener only
    await page.locator('#mount1').click()
    await page.locator('#mount2').click()
    await page.locator('#mount3').click()
    await expect(page.locator('#app-1 > *').first()).toBeVisible()
    await expect(page.locator('#app-2 > *').first()).toBeVisible()
    await expect(page.locator('#app-3 > *').first()).toBeVisible()
    await expect(page.locator('#popcount')).toContainText('1')
    await expect(page.locator('#guardcount')).toContainText('1')

    // they should all be displaying the home page
    await expect(page.locator('#app-1 .home')).toContainText('Home')
    await expect(page.locator('#app-1 li:nth-child(1) a')).toHaveClass(
      classRe('router-link-exact-active')
    )
    await expect(page.locator('#app-1 li:nth-child(2) a')).not.toHaveClass(
      classRe('router-link-active')
    )

    await expect(page.locator('#app-2 .home')).toContainText('Home')
    await expect(page.locator('#app-2 li:nth-child(1) a')).toHaveClass(
      classRe('router-link-exact-active')
    )
    await expect(page.locator('#app-2 li:nth-child(2) a')).not.toHaveClass(
      classRe('router-link-active')
    )

    await expect(page.locator('#app-3 .home')).toContainText('Home')
    await expect(page.locator('#app-3 li:nth-child(1) a')).toHaveClass(
      classRe('router-link-exact-active')
    )
    await expect(page.locator('#app-3 li:nth-child(2) a')).not.toHaveClass(
      classRe('router-link-active')
    )

    // navigation on app 1
    await page.locator('#app-1 li:nth-child(2) a').click()
    await expect(page.locator('#guardcount')).toContainText('2')
    await expect(page.locator('#app-1 .user')).toContainText('User 1')
    await expect(page.locator('#app-2 .user')).toContainText('User 1')
    await expect(page.locator('#app-3 .user')).toContainText('User 1')

    // navigation on app 2
    await page.locator('#app-2 li:nth-child(3) a').click()
    await expect(page.locator('#guardcount')).toContainText('3')
    await expect(page.locator('#app-1 .user')).toContainText('User 2')
    await expect(page.locator('#app-2 .user')).toContainText('User 2')
    await expect(page.locator('#app-3 .user')).toContainText('User 2')

    // should trigger the guard only once
    await page.goBack()
    await expect(page.locator('#guardcount')).toContainText('4')

    // unmounting apps should pause guards
    // start by navigating 3 times
    await page.locator('#app-1 li:nth-child(1) a').click()
    await page.locator('#app-1 li:nth-child(2) a').click()
    await page.locator('#app-1 li:nth-child(1) a').click()
    await expect(page.locator('#guardcount')).toContainText('7')
    await page.locator('#unmount1').click()
    await page.locator('#unmount2').click()
    await expect(page.locator('#guardcount')).toContainText('7')
    await page.goBack()
    // one app is still mounted
    await expect(page.locator('#guardcount')).toContainText('8')
    await page.locator('#unmount3').click()
    await page.goBack()
    await expect(page.locator('#guardcount')).toContainText('8')

    // mounting again should add the listeners again
    await page.locator('#mount1').click()
    // the initial navigation
    await expect(page.locator('#guardcount')).toContainText('9')
    await page.locator('#app-1 li:nth-child(2) a').click()
    await expect(page.locator('#guardcount')).toContainText('10')
  })

  test('supports navigation guards context with multiple apps', async ({
    page,
  }) => {
    await page.goto(baseURL + '/')
    await expect(page).toHaveURL(baseURL + '/')

    // mount multiple apps and expect to have one listener only
    await page.locator('#mount1').click()
    await expect(page.locator('#app-1 .home')).toContainText('Home')
    // toggle multiple times
    await page.locator('#app-1 li:nth-child(2) a').click()
    await expect(page.locator('#part-1 .count')).toContainText('0')
    await page.locator('#app-1 li:nth-child(3) a').click()
    await expect(page.locator('#part-1 .count')).toContainText('1')
    await page.locator('#mount2').click()
    await expect(page.locator('#app-2 .user')).toContainText('User')
    await page.locator('#app-1 li:nth-child(2) a').click()
    // first one keeps updating
    await expect(page.locator('#part-1 .count')).toContainText('2')
    // second app only updated once
    await expect(page.locator('#part-2 .count')).toContainText('1')
    await page.locator('#mount3').click()
  })
})
