import { test, expect } from '@playwright/test'

// resolved against `baseURL` from playwright.config.ts
const BASE = '/encoding'

const rawText = ' !"#$&\'()*+,/:;<=>?@[]^`{|}'

test.describe('encoding', () => {
  test('encodes values', async ({ page }) => {
    await page.goto(BASE + '/')
    await expect(page).toHaveURL(BASE + '/')
    await expect(page.getByText('Home', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: '/documents/€uro (object)' }).click()
    await expect(page).toHaveURL(BASE + '/documents/%E2%82%ACuro')
    await expect(page.locator('#fullPath')).toContainText(
      '/documents/%E2%82%ACuro'
    )
    await expect(page.locator('#path')).toContainText('/documents/%E2%82%ACuro')
    await expect(page.locator('#p-id')).toContainText('"€uro"')

    // full encoding test
    await page.getByRole('link', { name: 'Encoded by router' }).click()
    await expect(page.locator('#p-id')).toHaveText(`"${rawText}"`)
    await expect(page.locator('#query')).toHaveText(
      JSON.stringify({ 'a=': rawText }, null, 2)
    )
    await expect(page.locator('#hash')).toHaveText('#' + rawText)

    // link by the browser with minimal encoding
    // browsers will encode it differently but the resulted decoded values
    // should be consistent across browsers
    await page
      .getByRole('link', { name: 'Unencoded URL (force reload)' })
      .click()
    await expect(page.locator('#p-id')).toHaveText(`"${rawText}"`)
    await expect(page.locator('#query')).toHaveText(
      JSON.stringify({ 'a=': rawText }, null, 2)
    )
    await expect(page.locator('#hash')).toHaveText('#' + rawText)

    // check initial visit
    await page.goto(BASE + '/documents/%E2%82%ACuro')
    await expect(page.locator('#fullPath')).toContainText(
      '/documents/%E2%82%ACuro'
    )
    await expect(page.locator('#path')).toContainText('/documents/%E2%82%ACuro')
    await expect(page.locator('#p-id')).toContainText('"€uro"')

    // direct navigation to an unencoded unicode value in the path. Depending on
    // the browser the address bar will keep it raw or percent-encode it, but the
    // decoded param must be consistent across engines.
    await page.goto(BASE + '/documents/€uro')
    await expect(page.locator('#p-id')).toContainText('"€uro"')
    await expect(page.locator('#params')).toHaveText(
      JSON.stringify({ id: '€uro' }, null, 2)
    )
  })
})
