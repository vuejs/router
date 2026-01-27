import { type Page } from '@playwright/test'
import { test, expect } from '../fixtures/vite-server'

async function navigate(page: Page, to: string) {
  await page.getByTestId('navigator').getByRole('textbox').fill(to)
  await page.getByTestId('navigator').getByRole('button').click()
}

test.describe('Pages HMR', () => {
  let hmrToken: number = -1
  // reset hmr token before each test
  test.beforeEach(() => {
    hmrToken = -1
  })

  async function ensureHmrToken(page: Page) {
    hmrToken = await page.evaluate(
      () => ((window as any).__hmrToken ??= Math.random())
    )
  }

  // ensure hmr token is stable across tests
  test.afterEach(async ({ page }) => {
    if (hmrToken === -1) {
      throw new Error('hmrToken was not set in the test')
    }
    await expect
      .poll(async () => page.evaluate(() => (window as any).__hmrToken))
      .toBe(hmrToken)
  })

  test('applies meta changes in <route> block', async ({
    page,
    baseURL,
    applyEditFile,
  }) => {
    await page.goto(baseURL + '/')

    await expect(page.getByTestId('meta-hello')).toHaveText('')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/(home).vue',
      'edits/src/pages/(home)-route-block-with-meta.vue'
    )

    await expect(page.getByTestId('meta-hello')).toHaveText('world')
  })

  test('applies name changes via definePage', async ({
    page,
    baseURL,
    applyEditFile,
  }) => {
    await page.goto(baseURL + '/hmr-name')

    await expect(page.getByTestId('route-name')).toHaveText('/hmr-name')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-name.vue',
      'edits/src/pages/hmr-name-define-page-with-custom-name.vue'
    )

    await expect(page.getByTestId('route-name')).toHaveText('CustomName')
  })

  test('applies path changes via definePage', async ({
    page,
    baseURL,
    applyEditFile,
  }) => {
    await page.goto(baseURL + '/hmr-path')

    await expect(page.getByTestId('route')).toHaveText('/hmr-path')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-path.vue',
      'edits/src/pages/hmr-path-define-page-with-custom-path.vue'
    )

    // Navigate to the new custom path without a full reload
    await navigate(page, '/custom-path')

    await expect(page.getByTestId('route')).toHaveText('/custom-path')
  })

  test.skip('applies params parsers via definePage', async ({
    page,
    baseURL,
    applyEditFile,
  }) => {
    await page.goto(baseURL + '/hmr-params-123')

    // Initially params are strings
    await expect(page.getByTestId('param-id')).toHaveText('123')
    await expect(page.getByTestId('param-type')).toHaveText('string')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-params-[id].vue',
      'edits/src/pages/hmr-params-[id]-define-page-with-int-parser.vue'
    )

    // After HMR, params should be parsed as numbers
    await expect(page.getByTestId('param-id')).toHaveText('123')
    await expect(page.getByTestId('param-type')).toHaveText('number')
  })

  test('applies meta changes via definePage', async ({
    page,
    baseURL,
    applyEditFile,
  }) => {
    await page.goto(baseURL + '/hmr-meta')

    await expect(page.getByTestId('meta-hello')).toHaveText('')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-meta.vue',
      'edits/src/pages/hmr-meta-define-page-with-meta.vue'
    )

    await expect(page.getByTestId('meta-hello')).toHaveText('world')
  })

  test.skip('applies alias via definePage', async ({
    page,
    baseURL,
    applyEditFile,
  }) => {
    await page.goto(baseURL + '/hmr-alias')

    await expect(page.getByTestId('route')).toHaveText('/hmr-alias')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-alias.vue',
      'edits/src/pages/hmr-alias-define-page-with-alias.vue'
    )

    // we need to go to a different page first to avoid a duplicated navigation
    await navigate(page, '/')
    await expect(page.getByTestId('route')).toHaveText('/')
    await navigate(page, '/alias-path')

    await expect(page.getByTestId('route')).toHaveText('/alias-path')
  })

  test('updates definePage properties', async ({
    page,
    baseURL,
    applyEditFile,
  }) => {
    await page.goto(baseURL + '/hmr-update')

    await expect(page.getByTestId('meta-foo')).toHaveText('bar')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-update.vue',
      'edits/src/pages/hmr-update-define-page-with-updated-meta.vue'
    )

    await expect(page.getByTestId('meta-foo')).toHaveText('updated')
  })
})
