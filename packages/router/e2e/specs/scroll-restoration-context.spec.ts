import { expect, test, type Page } from '@playwright/test'
import { reloadKeepingState } from './utils'

const top = (page: Page) => page.evaluate(() => window.scrollY)
const visible = (page: Page, path: string) =>
  expect(page.locator(`[data-page="${path}"]`)).toBeVisible()
const link = async (page: Page, name: string) => {
  await page.getByRole('link', { name, exact: true }).evaluate(el => el.click())
  await visible(page, `/${name}`)
}
const back = async (page: Page, path: string) => {
  await page.evaluate(() => history.back())
  await visible(page, path)
}
const forward = async (page: Page, path: string) => {
  await page.evaluate(() => history.forward())
  await visible(page, path)
}

for (const mode of ['web', 'hash']) {
  const start =
    mode === 'web'
      ? '/scroll-restoration-context/a'
      : '/scroll-restoration-context/?hash#/a'

  test.describe(`scroll restoration context (${mode})`, () => {
    test('retains isolated params/query arrays for manual restoration', async ({
      page,
    }) => {
      await page.goto(start)
      await visible(page, '/a')
      const result = await page.evaluate(async () => {
        const { contextRouter: router, contextTrace: trace } = window as any
        await router.push('/parts/one/two?manual&tag=x&tag&tag=&tag=y')
        const live = router.currentRoute.value
        const restoreCount = () =>
          trace.filter((e: any) => e.phase === 'restore').length
        const beforeReady = restoreCount()
        live.params.segments.push('live')
        live.query.tag.push('live')
        window.dispatchEvent(new Event('data-ready'))
        const saved = trace.filter((e: any) => e.phase === 'restore').at(-1)
        const rejected: boolean[] = []
        for (const value of [saved.route.params.segments, saved.to.query.tag]) {
          try {
            value.push('callback')
            rejected.push(false)
          } catch (error) {
            rejected.push(error instanceof TypeError)
          }
        }
        const observation = {
          beforeReady,
          afterReady: restoreCount(),
          rejected,
          params: saved.to.params.segments,
          query: saved.to.query.tag,
          liveParams: [...live.params.segments],
          liveQuery: [...live.query.tag],
          sameParams: saved.to.params.segments === live.params.segments,
          sameQuery: saved.to.query.tag === live.query.tag,
        }
        await router.push('/b')
        return {
          ...observation,
          retainedParams: saved.to.params.segments,
          retainedQuery: saved.to.query.tag,
        }
      })
      expect(result.afterReady).toBe(result.beforeReady + 1)
      expect(result).toMatchObject({
        rejected: [true, true],
        params: ['one', 'two'],
        query: ['x', null, '', 'y'],
        liveParams: ['one', 'two', 'live'],
        liveQuery: ['x', null, '', 'y', 'live'],
        sameParams: false,
        sameQuery: false,
        retainedParams: ['one', 'two'],
        retainedQuery: ['x', null, '', 'y'],
      })
    })

    test('separates new links from Back/Forward and restores both entries', async ({
      page,
    }) => {
      await page.goto(start)
      await visible(page, '/a')
      await page.evaluate(() => window.scrollTo(0, 600))
      await link(page, 'b')
      await expect.poll(() => top(page)).toBe(0)
      await page.evaluate(() => window.scrollTo(0, 300))
      await back(page, '/a')
      await expect.poll(() => top(page)).toBe(600)
      await page.evaluate(() => window.scrollTo(0, 700))
      await forward(page, '/b')
      await expect.poll(() => top(page)).toBe(300)
      await link(page, 'a')
      await expect.poll(() => top(page)).toBe(0)
      await back(page, '/b')
      await expect.poll(() => top(page)).toBe(300)
      await back(page, '/a')
      await expect.poll(() => top(page)).toBe(700)
      // Replace the forward branch with a new entry at a reused position.
      await link(page, 'b')
      await expect.poll(() => top(page)).toBe(0)
    })

    test('keeps the entry and position across reload', async ({ page }) => {
      await page.goto(start)
      await visible(page, '/a')
      await page.evaluate(() => window.scrollTo(0, 650))
      const position = await page.evaluate(() => history.state.position)
      await reloadKeepingState(page)
      await visible(page, '/a')
      await expect.poll(() => top(page)).toBe(650)
      expect(await page.evaluate(() => history.state.position)).toBe(position)
    })

    test('uses the final operation for redirects and replace', async ({
      page,
    }) => {
      await page.goto(start)
      await visible(page, '/a')
      const position = await page.evaluate(() => history.state.position)
      await page.evaluate(() =>
        (window as any).contextRouter.replace('/redirect')
      )
      await visible(page, '/b')
      expect(await page.evaluate(() => history.state.position)).toBe(position)
      const context = await page.evaluate(() =>
        (window as any).contextTrace
          .filter((e: any) => e.phase === 'restore')
          .at(-1)
      )
      expect(context).toMatchObject({
        type: 'replace',
        historyPosition: position,
        from: { path: '/a' },
        to: { path: '/b' },
      })
    })

    test('allows data-ready manual restoration with the traversal context', async ({
      page,
    }) => {
      await page.goto(
        mode === 'web'
          ? '/scroll-restoration-context/a?manual'
          : '/scroll-restoration-context/?hash#/a?manual'
      )
      await visible(page, '/a')
      await page.evaluate(() => window.scrollTo(0, 640))
      await link(page, 'b')
      await page.evaluate(() => window.scrollTo(0, 310))
      await back(page, '/a')
      // No automatic restoration: data-ready is controlled by the application.
      expect(await top(page)).toBe(310)
      await page.evaluate(() => window.dispatchEvent(new Event('data-ready')))
      await expect.poll(() => top(page)).toBe(640)
    })
  })
}
