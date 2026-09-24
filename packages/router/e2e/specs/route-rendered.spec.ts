import { expect, test, type Page } from '@playwright/test'

const settled = (page: Page) => page.evaluate(() => window.settled)

async function navigate(page: Page, name: string) {
  await page.evaluate(() => (window.settled = []))
  await page.getByRole('link', { name, exact: true }).click()
}

test.describe('onRouteRendered', () => {
  test('logs once per navigation after the new view is displayed', async ({
    page,
  }) => {
    await page.goto('/route-rendered/a')
    await expect.poll(() => settled(page)).toHaveLength(1)

    // out-in transition: only after A left
    await page.evaluate(() => (window.rootNavigations = []))
    await navigate(page, 'b')
    // outside of any RouterView: in afterEach, before B renders
    expect(await page.evaluate(() => window.rootNavigations)).toEqual([
      { path: '/b', view: 'A /a' },
    ])
    await expect(page.locator('.fade-leave-active')).toHaveCount(1)
    expect(await settled(page)).toEqual([])
    await expect
      .poll(() => settled(page))
      .toEqual([{ depth: 0, path: '/b', view: 'B /b', leaving: 0 }])

    // KeepAlive activation
    await navigate(page, 'a')
    await expect
      .poll(() => settled(page))
      .toEqual([{ depth: 0, path: '/a', view: 'A /a', leaving: 0 }])

    // async setup in Suspense after the transition
    await navigate(page, 'async')
    await page.waitForTimeout(350)
    expect(await settled(page)).toEqual([])
    await expect
      .poll(() => settled(page))
      .toEqual([{ depth: 0, path: '/async', view: 'Async /async', leaving: 0 }])

    // reused component
    await navigate(page, 'user 1')
    await expect(page.locator('#view')).toHaveText('User /user/1')
    await navigate(page, 'user 2')
    await expect
      .poll(() => settled(page))
      .toEqual([
        { depth: 0, path: '/user/2', view: 'User /user/2', leaving: 0 },
      ])

    // nested views
    await navigate(page, 'nested x')
    await expect.poll(() => settled(page)).toHaveLength(2)
    await navigate(page, 'nested y')
    await expect
      .poll(() => settled(page))
      .toEqual([
        { depth: 0, path: '/nested/y', view: 'Parent Y /nested/y', leaving: 0 },
        { depth: 1, path: '/nested/y', view: 'Parent Y /nested/y', leaving: 0 },
      ])
    await page.waitForTimeout(500)
    expect(await settled(page)).toHaveLength(2)
  })

  test('logs once per query or hash change', async ({ page }) => {
    await page.goto('/route-rendered/user/2')
    await expect.poll(() => settled(page)).toHaveLength(1)

    for (const [name, path] of [
      ['user 2 posts', '/user/2?tab=posts'],
      ['user 2 likes', '/user/2?tab=likes'],
      ['user 2 #bio', '/user/2#bio'],
      ['user 2 #links', '/user/2#links'],
    ]) {
      await navigate(page, name)
      await expect
        .poll(() => settled(page))
        .toEqual([{ depth: 0, path, view: `User ${path}`, leaving: 0 }])
    }

    await navigate(page, 'nested y')
    await expect.poll(() => settled(page)).toHaveLength(2)

    for (const [name, path] of [
      ['nested y posts', '/nested/y?tab=posts'],
      ['nested y #bio', '/nested/y#bio'],
    ]) {
      await navigate(page, name)
      await expect
        .poll(() => settled(page))
        .toEqual([
          { depth: 0, path, view: `Parent Y ${path}`, leaving: 0 },
          { depth: 1, path, view: `Parent Y ${path}`, leaving: 0 },
        ])
    }

    await page.waitForTimeout(500)
    expect(await settled(page)).toHaveLength(2)
  })

  test('logs once per view with a child keyed by route.path', async ({
    page,
  }) => {
    await page.goto('/route-rendered/keyed/1')
    await expect
      .poll(() => settled(page))
      .toEqual([
        {
          depth: 1,
          path: '/keyed/1',
          view: 'Keyed Item #1 /keyed/1',
          leaving: 0,
        },
        {
          depth: 0,
          path: '/keyed/1',
          view: 'Keyed Item #1 /keyed/1',
          leaving: 0,
        },
      ])

    // new key: the parent view settles right away, the child view only after
    // the old instance left and a new one mounted
    await navigate(page, 'keyed 2')
    await expect
      .poll(() => settled(page))
      .toEqual([
        {
          depth: 0,
          path: '/keyed/2',
          // the leaving instance is not re-rendered
          view: 'Keyed Item #1 /keyed/1',
          leaving: 1,
        },
        {
          depth: 1,
          path: '/keyed/2',
          view: 'Keyed Item #2 /keyed/2',
          leaving: 0,
        },
      ])

    // same key: the instance is reused, no transition
    for (const [name, path] of [
      ['keyed 2 posts', '/keyed/2?tab=posts'],
      ['keyed 2 #bio', '/keyed/2#bio'],
    ]) {
      await navigate(page, name)
      await expect
        .poll(() => settled(page))
        .toEqual([
          { depth: 0, path, view: `Keyed Item #2 ${path}`, leaving: 0 },
          { depth: 1, path, view: `Keyed Item #2 ${path}`, leaving: 0 },
        ])
    }

    await page.waitForTimeout(500)
    expect(await settled(page)).toHaveLength(2)
  })
})
