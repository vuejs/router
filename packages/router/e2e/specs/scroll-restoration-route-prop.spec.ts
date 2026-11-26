import { expect, test, type Page } from '@playwright/test'

async function rendered(page: Page, path: string) {
  await expect(page.locator('main')).toHaveAttribute('data-page', path)
  // RouterView settles after Vue's post-render hooks.
  await page.evaluate(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
}

for (const experimental of [false, true]) {
  for (const hash of [false, true]) {
    for (const plain of [false, true]) {
      test(`${experimental ? 'experimental' : 'classic'} ${hash ? 'hash' : 'web'} ${plain ? 'plain' : 'resolved'} restores new links, Back and Forward`, async ({
        page,
      }) => {
        const errors: string[] = []
        page.on('pageerror', error => errors.push(String(error)))
        const query = new URLSearchParams({
          ...(experimental && { experimental: '' }),
          ...(hash && { hash: '' }),
          ...(plain && { plain: '' }),
        })
        await page.goto(
          `/scroll-restoration-route-prop/${hash ? '' : 'a'}?${query}${hash ? '#/a' : ''}`
        )
        await rendered(page, '/a')
        await page.evaluate(() => window.scrollTo(0, 800))
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(800)
        await page.evaluate(() => (window as any).routePropRouter.push('/b'))
        await rendered(page, '/b')
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
        await page.evaluate(() => window.scrollTo(0, 300))
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300)
        await page.evaluate(() => window.history.back())
        await rendered(page, '/a')
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(800)
        await page.evaluate(() => window.history.forward())
        await rendered(page, '/b')
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300)
        const trace = await page.evaluate(() => (window as any).routePropTrace)
        expect(trace.map((c: any) => c.displayed)).toEqual([
          '/a',
          '/b',
          '/a',
          '/b',
        ])
        expect(trace.at(-2)).toMatchObject({
          type: 'pop',
          delta: -1,
          direction: 'back',
          route: { path: '/a' },
          from: { path: '/b' },
          to: { path: '/a' },
        })
        expect(trace.at(-1)).toMatchObject({
          type: 'pop',
          delta: 1,
          direction: 'forward',
          route: { path: '/b' },
          from: { path: '/a' },
          to: { path: '/b' },
        })
        expect(typeof trace.at(-1).historyPosition).toBe('number')
        expect(errors).toEqual([])
      })
    }
    test(`${experimental ? 'experimental' : 'classic'} ${hash ? 'hash' : 'web'} manual route prop waits for data and ignores late calls`, async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', error => errors.push(String(error)))
      const query = new URLSearchParams({
        manual: '',
        ...(experimental && { experimental: '' }),
        ...(hash && { hash: '' }),
      })
      await page.goto(
        `/scroll-restoration-route-prop/${hash ? '' : 'a'}?${query}${hash ? '#/a' : ''}`
      )
      await rendered(page, '/a')
      expect(await page.evaluate(() => (window as any).routePropTrace)).toEqual(
        []
      )
      await page.evaluate(() => (window as any).routePropScrolls[0]())
      await page.evaluate(() => window.scrollTo(0, 800))
      await page.evaluate(() => (window as any).routePropRouter.push('/b'))
      await rendered(page, '/b')
      await page.evaluate(() => window.scrollTo(0, 300))
      await page.evaluate(() => (window as any).routePropScrolls[0]())
      expect(
        await page.evaluate(() => (window as any).routePropTrace.length)
      ).toBe(1)
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300)
      await page.evaluate(() => window.history.back())
      await rendered(page, '/a')
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300)
      await page.evaluate(() => (window as any).routePropScrolls.at(-1)())
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(800)
      const last = await page.evaluate(() =>
        (window as any).routePropTrace.at(-1)
      )
      expect(last).toMatchObject({
        type: 'pop',
        direction: 'back',
        delta: -1,
        route: { path: '/a' },
      })
      await page.evaluate(() => (window as any).routePropUnmount())
      await page.evaluate(() => (window as any).routePropScrolls.at(-1)())
      expect(
        await page.evaluate(() => (window as any).routePropTrace.length)
      ).toBe(2)
      expect(errors).toEqual([])
    })
  }
}

test('classic background route restores its displayed location without inventing a history entry', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.goto('/scroll-restoration-route-prop/b?background')
  await rendered(page, '/a')
  expect(
    await page.evaluate(
      () => (window as any).routePropRouter.currentRoute.value.path
    )
  ).toBe('/b')
  const initial = await page.evaluate(() => (window as any).routePropTrace)
  expect(initial).toHaveLength(1)
  expect(initial[0]).toMatchObject({
    displayed: '/a',
    route: { path: '/a' },
    to: { path: '/b' },
    type: 'initial',
  })
  expect(initial[0].historyPosition).toBeUndefined()
  await page.evaluate(() => (window as any).routePropRouter.push('/slow'))
  // A fixed background keeps displaying /a instead of mounting the URL's slow page.
  await rendered(page, '/a')
  expect(await page.evaluate(() => (window as any).routePropTrace.length)).toBe(
    1
  )
  await page.evaluate(() => (window as any).routePropScrolls[0]())
  const last = await page.evaluate(() => (window as any).routePropTrace.at(-1))
  expect(last).toMatchObject({
    displayed: '/a',
    route: { path: '/a' },
    from: { path: '/b' },
    to: { path: '/slow' },
    type: 'push',
  })
  expect(last.historyPosition).toBeUndefined()
  expect(errors).toEqual([])
})

test('a superseded Suspense page cannot restore when its async setup completes', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.goto('/scroll-restoration-route-prop/a')
  await rendered(page, '/a')
  await page.evaluate(() => window.scrollTo(0, 800))
  await page.evaluate(() => (window as any).routePropRouter.push('/slow'))
  await expect
    .poll(() => page.evaluate(() => (window as any).routePropScrolls.length))
    .toBe(2)
  await page.evaluate(() => (window as any).routePropScrolls[1]())
  expect(await page.evaluate(() => (window as any).routePropTrace.length)).toBe(
    1
  )
  await page.evaluate(() => (window as any).routePropRouter.push('/b'))
  await rendered(page, '/b')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.evaluate(() => window.scrollTo(0, 300))
  await page.evaluate(() => (window as any).routePropRelease())
  await rendered(page, '/b')
  await page.evaluate(() => (window as any).routePropScrolls[1]())
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300)
  expect(
    await page.evaluate(() =>
      (window as any).routePropTrace.map((c: any) => c.displayed)
    )
  ).toEqual(['/a', '/b'])
  expect(errors).toEqual([])
})
