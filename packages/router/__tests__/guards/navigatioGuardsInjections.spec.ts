/**
 * @jest-environment jsdom
 */
import { createDom, newRouter as createRouter } from '../utils'
import { mount } from '@vue/test-utils'
import { inject } from 'vue'
import { mockWarn } from 'jest-mock-warn'
import type { Router } from '../../src'

describe('inject() within navigation guards', () => {
  mockWarn()
  beforeAll(() => {
    createDom()
  })

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
})
