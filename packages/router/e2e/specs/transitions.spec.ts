import { test, expect, type Page } from '@playwright/test'

// nav links render their `to` as their text; `exact` avoids `/parent` matching
// `/parent/foo`, `/` matching everything, etc.
const link = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true })

test.describe('transitions', () => {
  test('transitions', async ({ page }) => {
    await page.goto('/transitions/')
    await expect(
      page.getByRole('heading', { name: 'Transitions' })
    ).toBeVisible()

    await link(page, '/parent').click()
    await expect(page.locator('.view.home')).toContainClass('fade-leave-active')
    await expect(page.locator('.view.parent').first()).toBeVisible()
    await expect(page.locator('.view.parent')).toContainClass(
      'fade-enter-active'
    )
    await expect(page.locator('.child-view.default')).not.toContainClass(
      'slide-left-enter-active'
    )
    await expect(page.locator('.view.parent.fade-enter-active')).toHaveCount(0)

    await link(page, '/parent/foo').click()
    await expect(page.locator('.child-view.default')).toContainClass(
      'slide-left-leave-active'
    )
    await expect(page.locator('.child-view.foo')).toContainClass(
      'slide-left-enter-active'
    )
    await expect(page.locator('.child-view.default')).toHaveCount(0)

    await link(page, '/parent/bar').click()
    await expect(page.locator('.child-view.foo')).toContainClass(
      'slide-left-leave-active'
    )
    await expect(page.locator('.child-view.bar')).toContainClass(
      'slide-left-enter-active'
    )
    await expect(page.locator('.child-view.foo')).toHaveCount(0)

    await link(page, '/parent').click()
    await expect(page.locator('.child-view.bar')).toContainClass(
      'slide-right-leave-active'
    )
    await expect(page.locator('.child-view.default')).toContainClass(
      'slide-right-enter-active'
    )
    await expect(page.locator('.child-view.bar')).toHaveCount(0)

    await link(page, '/').click()
    await expect(page.locator('.view.parent')).toContainClass(
      'fade-leave-active'
    )
    await expect(page.locator('.view.home').first()).toBeVisible()
    await expect(page.locator('.view.home')).toContainClass('fade-enter-active')
    await expect(page.locator('.view.home.fade-enter-active')).toHaveCount(0)

    await link(page, 'Not existing').click()
    await expect(page.locator('.view.home')).toContainClass('fade-leave-active')
    await expect(page.locator('.view.home')).toHaveCount(0)
    await link(page, '/parent').click()
    await expect(page.locator('.view.parent')).toContainClass(
      'fade-enter-active'
    )
  })

  test('out in transitions', async ({ page }) => {
    await page.goto('/transitions/')
    await expect(
      page.getByRole('heading', { name: 'Transitions' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Toggle Transition' }).click()

    await link(page, '/nested/foo').click()
    await expect(page.locator('.nested-view')).toContainText('foo')
    await link(page, '/').click()
    await expect(page.locator('.view.home').first()).toBeVisible()
    await link(page, '/nested/foo').click()
    await expect(page.locator('.nested-view')).toContainText('foo')
  })
})
