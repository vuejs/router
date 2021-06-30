import { createMemoryHistory, createRouter, RouterHistory } from '../src'
import { tick } from './utils'

const component = {}

interface RouterHistory_Test extends RouterHistory {
  changeURL(url: string): void
}

describe('hash history edge cases', () => {
  it('correctly sets the url when it is manually changed but aborted with a redirect in guard', async () => {
    const history = createMemoryHistory() as RouterHistory_Test
    const router = createRouter({
      history,
      routes: [
        { path: '/', component },
        { path: '/foo', component },
      ],
    })

    await router.push('/foo?step=1')
    await router.push('/foo?step=2')
    await router.push('/foo?step=3')
    router.back()
    await tick() // wait for router listener on history
    expect(router.currentRoute.value.fullPath).toBe('/foo?step=2')

    // force a redirect next time
    const removeListener = router.beforeEach(to => {
      if (to.path === '/') {
        removeListener()
        return '/foo?step=2'
      }
      return
    })

    // const spy = jest.spyOn(history, 'go')

    history.changeURL('/')
    await tick()
    expect(router.currentRoute.value.fullPath).toBe('/foo?step=2')
    expect(history.location).toBe('/foo?step=2')
    // expect(spy).toHaveBeenCalledTimes(1)
    // expect(spy).toHaveBeenCalledWith(-1)
  })

  it('correctly sets the url when it is manually changed but aborted with guard', async () => {
    const history = createMemoryHistory() as RouterHistory_Test
    const router = createRouter({
      history,
      routes: [
        { path: '/', component },
        { path: '/foo', component },
      ],
    })

    await router.push('/foo?step=1')
    await router.push('/foo?step=2')
    await router.push('/foo?step=3')
    router.back()
    await tick() // wait for router listener on history
    expect(router.currentRoute.value.fullPath).toBe('/foo?step=2')

    // force a redirect next time
    const removeListener = router.beforeEach(to => {
      if (to.path === '/') {
        removeListener()
        return false
      }

      return
    })

    // const spy = jest.spyOn(history, 'go')

    history.changeURL('/')
    await tick()
    expect(router.currentRoute.value.fullPath).toBe('/foo?step=2')
    expect(history.location).toBe('/foo?step=2')
    // expect(spy).toHaveBeenCalledTimes(1)
    // expect(spy).toHaveBeenCalledWith(-1)
  })
})
