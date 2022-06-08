import { createRouter, createMemoryHistory } from '../src'
import { h } from 'vue'
import { createDom } from './utils'
// import { mockWarn } from 'jest-mock-warn'

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t))

function newRouter(options: Partial<Parameters<typeof createRouter>[0]> = {}) {
  const history = options.history || createMemoryHistory()
  const router = createRouter({
    history,
    routes: [
      {
        path: '/:pathMatch(.*)',
        component: {
          render: () => h('div', 'any route'),
        },
      },
    ],
    ...options,
  })

  return { history, router }
}

describe('Multiple apps', () => {
  beforeAll(() => {
    createDom()
    const rootEl = document.createElement('div')
    rootEl.id = 'app'
    document.body.appendChild(rootEl)
  })

  it('does not listen to url changes before being ready', async () => {
    const { router, history } = newRouter()

    const spy = jest.fn((to, from, next) => {
      next()
    })
    router.beforeEach(spy)

    history.push('/foo')
    history.push('/bar')
    history.go(-1, true)

    await delay(5)
    expect(spy).not.toHaveBeenCalled()

    await router.push('/baz')

    history.go(-1, true)
    await delay(5)
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
