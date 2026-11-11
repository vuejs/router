import { test, expect, type Page } from '@playwright/test'

// the app has no base so paths include the folder
const BASE = '/history-url'

declare global {
  interface Window {
    __alive?: boolean
  }
}

// a full page load would remove the marker
async function setAliveMarker(page: Page) {
  await page.evaluate(() => window.r.isReady())
  await page.evaluate(() => (window.__alive = true))
}

async function expectSamePage(page: Page) {
  expect(await page.evaluate(() => window.__alive)).toBe(true)
}

// `location.href` hides the userinfo, `document.URL` does not
function getDocumentURL(page: Page) {
  return page.evaluate(() => document.URL)
}

test.describe('history url', () => {
  // #2714
  test('keeps the userinfo of the url', async ({ page, baseURL }) => {
    const origin = baseURL!.replace('://', '://user:pass@')
    await page.goto(origin + BASE + '/')
    await setAliveMarker(page)
    expect(await getDocumentURL(page)).toBe(origin + BASE + '/')

    await page.evaluate(() => window.r.push('/history-url/foo?q=1#h'))
    await expect(page.locator('#fullPath')).toHaveText(BASE + '/foo?q=1#h')
    expect(await getDocumentURL(page)).toBe(origin + BASE + '/foo?q=1#h')

    await page.evaluate(() => window.r.replace('/history-url/bar'))
    await expect(page.locator('#fullPath')).toHaveText(BASE + '/bar')
    expect(await getDocumentURL(page)).toBe(origin + BASE + '/bar')

    await page.goBack()
    await expect(page.locator('#fullPath')).toHaveText(BASE + '/')
    expect(await getDocumentURL(page)).toBe(origin + BASE + '/')
    await expectSamePage(page)
  })

  test('keeps paths read as another host on the same origin', async ({
    page,
    baseURL,
  }) => {
    await page.goto(BASE + '/')
    await setAliveMarker(page)

    // `\` is read as `/`, tabs and newlines are removed
    for (const path of ['//evil.com', '/\\evil.com', '/\t/evil.com']) {
      for (const method of ['push', 'replace'] as const) {
        await page.evaluate(([method, path]) => window.r[method](path), [
          method,
          path,
        ] as const)
        await expect(page.locator('#fullPath')).toHaveText(path)
        expect(await getDocumentURL(page)).toBe(baseURL + '//evil.com')
        // leave so the next navigation is not a duplicate
        await page.evaluate(() => window.r.push('/history-url/'))
      }
    }
    await expectSamePage(page)
  })
})
