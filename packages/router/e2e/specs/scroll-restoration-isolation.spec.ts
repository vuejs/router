import { expect, test } from '@playwright/test'

for (const [kind, host] of [
  ['classic', 'sidebar'],
  ['experimental', 'sidebar'],
  ['classic', 'background'],
]) {
  for (const seeded of [false, true]) {
    test(`isolates startup context (${kind}/${host}/other router started: ${seeded})`, async ({
      page,
    }) => {
      await page.goto(
        `/scroll-restoration-isolation/?kind=${kind}&host=${host}&seeded=${seeded ? 'yes' : 'no'}`
      )
      await page.waitForFunction(() => (window as any).isolationReview?.ready)
      const before = await page.evaluate(() => {
        const state = (window as any).isolationReview
        state.scroll()
        state.capture()
        return {
          failure: state.failure,
          atStart: state.atStart,
          restores: state.trace.filter((x: any) => x.phase === 'restore')
            .length,
          context: state.trace.filter((x: any) => x.phase === 'capture').at(-1)
            .context,
        }
      })
      expect(before).toMatchObject({
        failure: 4,
        atStart: true,
        restores: 0,
        context: {
          type: 'initial',
          delta: 0,
          direction: '',
          historyPosition: undefined,
          route: { path: '/', params: {}, query: {} },
          from: { path: '/', params: {}, query: {} },
          to: { path: '/', params: {}, query: {} },
        },
      })
      await page.evaluate(() => (window as any).isolationReview.release())
      const after = await page.evaluate(() => {
        const state = (window as any).isolationReview
        state.capture()
        return state.trace.filter((x: any) => x.phase === 'capture').at(-1)
          .context
      })
      expect(after).toMatchObject({
        type: 'initial',
        delta: 0,
        direction: '',
        historyPosition: await page.evaluate(() => history.state.position),
        route: { path: '/beta' },
        from: { path: '/' },
        to: { path: '/beta' },
      })
      await page.evaluate(() => (window as any).isolationReview.close())
    })
  }
}
