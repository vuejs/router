import { test, expect } from '@playwright/test'

// matches one class within a space-separated class attribute
const classRe = (cls: string) =>
  new RegExp(`(^|\\s)${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`)

test.describe('transitions', () => {
  test('transitions', async ({ page }) => {
    await page.goto('/transitions/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator('.view.home')).toHaveClass(
      classRe('fade-leave-active')
    )
    await expect(page.locator('.view.parent').first()).toBeVisible()
    await expect(page.locator('.view.parent')).toHaveClass(
      classRe('fade-enter-active')
    )
    await expect(page.locator('.child-view.default')).not.toHaveClass(
      classRe('slide-left-enter-active')
    )
    await expect(page.locator('.view.parent.fade-enter-active')).toHaveCount(0)

    await page.locator('li:nth-child(3) a').click()
    await expect(page.locator('.child-view.default')).toHaveClass(
      classRe('slide-left-leave-active')
    )
    await expect(page.locator('.child-view.foo')).toHaveClass(
      classRe('slide-left-enter-active')
    )
    await expect(page.locator('.child-view.default')).toHaveCount(0)

    await page.locator('li:nth-child(4) a').click()
    await expect(page.locator('.child-view.foo')).toHaveClass(
      classRe('slide-left-leave-active')
    )
    await expect(page.locator('.child-view.bar')).toHaveClass(
      classRe('slide-left-enter-active')
    )
    await expect(page.locator('.child-view.foo')).toHaveCount(0)

    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator('.child-view.bar')).toHaveClass(
      classRe('slide-right-leave-active')
    )
    await expect(page.locator('.child-view.default')).toHaveClass(
      classRe('slide-right-enter-active')
    )
    await expect(page.locator('.child-view.bar')).toHaveCount(0)

    await page.locator('li:nth-child(1) a').click()
    await expect(page.locator('.view.parent')).toHaveClass(
      classRe('fade-leave-active')
    )
    await expect(page.locator('.view.home').first()).toBeVisible()
    await expect(page.locator('.view.home')).toHaveClass(
      classRe('fade-enter-active')
    )
    await expect(page.locator('.view.home.fade-enter-active')).toHaveCount(0)

    await page.locator('li:nth-child(5) a').click()
    await expect(page.locator('.view.home')).toHaveClass(
      classRe('fade-leave-active')
    )
    await expect(page.locator('.view.home')).toHaveCount(0)
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator('.view.parent')).toHaveClass(
      classRe('fade-enter-active')
    )
  })

  test('out in transitions', async ({ page }) => {
    await page.goto('/transitions/')
    await expect(page.locator('#app > *').first()).toBeVisible()
    await page.locator('#toggle-transition').click()

    await page.locator('li:nth-child(7) a').click()
    await expect(page.locator('.nested-view')).toContainText('foo')
    await page.locator('li:nth-child(1) a').click()
    await expect(page.locator('.view.home').first()).toBeVisible()
    await page.locator('li:nth-child(7) a').click()
    await expect(page.locator('.nested-view')).toContainText('foo')
  })
})
