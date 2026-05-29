import { test, expect } from '@playwright/test'

const baseURL = 'http://localhost:3000/encoding'

const rawText = ' !"#$&\'()*+,/:;<=>?@[]^`{|}'

test.describe('encoding', () => {
  test('encodes values', async ({ page }) => {
    await page.goto(baseURL + '/')
    await expect(page).toHaveURL(baseURL + '/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('li:nth-child(3) a').click()
    await expect(page).toHaveURL(baseURL + '/documents/%E2%82%ACuro')
    await expect(page.locator('#fullPath')).toContainText(
      '/documents/%E2%82%ACuro'
    )
    await expect(page.locator('#path')).toContainText('/documents/%E2%82%ACuro')
    await expect(page.locator('#p-id')).toContainText('"€uro"')

    // full encoding test
    await page.locator('li:nth-child(8) a').click()
    await expect(page.locator('#p-id')).toHaveText(`"${rawText}"`)
    await expect(page.locator('#query')).toHaveText(
      JSON.stringify({ 'a=': rawText }, null, 2)
    )
    await expect(page.locator('#hash')).toHaveText('#' + rawText)

    // link by the browser with minimal encoding
    // browsers will encode it differently but the resulted decoded values
    // should be consistent across browsers
    await page.locator('li:nth-child(7) a').click()
    await expect(page.locator('#app > *').first()).toBeVisible()
    await expect(page.locator('#p-id')).toHaveText(`"${rawText}"`)
    await expect(page.locator('#query')).toHaveText(
      JSON.stringify({ 'a=': rawText }, null, 2)
    )
    await expect(page.locator('#hash')).toHaveText('#' + rawText)

    // check initial visit
    await page.goto(baseURL + '/documents/%E2%82%ACuro')
    await expect(page.locator('#app > *').first()).toBeVisible()
    // .assert.textContains('#fullPath', '/documents/%E2%82%ACuro')
    // .assert.textContains('#path', '/documents/%E2%82%ACuro')
    await expect(page.locator('#p-id')).toContainText('"€uro"')

    // TODO: invalid in safari, tests on those where this is valid
    // await page.goto(baseURL + '/unicode/€uro')
    // await expect(page.locator('#app > *').first()).toBeVisible()
    // navigation to unencoded value
    // depending on the browser the value will be encoded or not
    // await expect(page.locator('#params')).toHaveText(JSON.stringify({ id: '€uro' }, null, 2))
  })
})
