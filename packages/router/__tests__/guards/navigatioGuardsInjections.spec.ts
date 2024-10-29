/**
 * @vitest-environment happy-dom
 */
import { newRouter as createRouter } from '../utils'
import { mount } from '@vue/test-utils'
import { inject } from 'vue'
import { mockWarn } from '../vitest-mock-warn'
import { createMemoryHistory, type Router } from '../../src'
import { describe, expect, it } from 'vitest'

describe('inject() within navigation guards', () => {
  mockWarn()

  const PageComponent = {
    template: `<div>Page</div>`,
  }

  function factory(router: Router) {
    return mount(
      {
        template: `<RouterView />`,
      },
      {
        global: {
          plugins: [router],
          provide: {
            test: 'hello',
          },
        },
      }
    )
  }

  const globalGuards = ['beforeEach', 'beforeResolve', 'afterEach'] as const

  for (const guardName of globalGuards) {
    it(`router.${guardName}()`, async () => {
      expect.assertions(1)
      const router = createRouter({
        routes: [{ path: '/', component: PageComponent }],
      })
      router[guardName](() => {
        expect(inject('test')).toBe('hello')
      })
      factory(router)
      await router.isReady()
    })
  }

  describe('in-component guards', () => {
    it('beforeRouteEnter', async () => {
      expect.assertions(1)
      const router = createRouter({
        routes: [
          {
            path: '/',
            component: {
              template: `<div>Page</div>`,
              beforeRouteEnter() {
                expect(inject('test')).toBe('hello')
              },
            },
          },
        ],
      })
      factory(router)
      await router.isReady()
      await router.push('/')
    })

    it('beforeRouteEnter + lazy load', async () => {
      expect.assertions(1)
      const router = createRouter({
        routes: [
          {
            path: '/',
            component: () =>
              new Promise(r =>
                r({
                  template: `<div>Page</div>`,
                  beforeRouteEnter() {
                    expect(inject('test')).toBe('hello')
                  },
                })
              ),
          },
        ],
      })
      factory(router)
      await router.isReady()
      await router.push('/')
    })

    it('beforeRouteUpdate', async () => {
      expect.assertions(1)
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            component: {
              template: `<div>Page</div>`,
              beforeRouteUpdate() {
                expect(inject('test')).toBe('hello')
              },
            },
          },
        ],
      })
      factory(router)
      await router.isReady()
      await router.push('/')
      await router.push('/#other')
    })

    it('beforeRouteLeave', async () => {
      expect.assertions(1)
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', component: PageComponent },
          {
            path: '/foo',
            component: {
              template: `<div>Page</div>`,
              beforeRouteLeave() {
                expect(inject('test')).toBe('hello')
              },
            },
          },
        ],
      })
      factory(router)
      await router.isReady()
      await router.push('/foo')
      await router.push('/')
    })
  })
})
