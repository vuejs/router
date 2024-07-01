import { createRouter, createWebHistory } from './index'
import { defineComponent } from 'vue'
import { describe, it, expectTypeOf } from 'vitest'

const component = defineComponent({})

declare module '.' {
  interface RouteMeta {
    requiresAuth?: boolean
    // TODO: it would be nice to be able to test required meta without polluting all tests
    nested?: { foo: string }
  }
}

describe('RouteMeta', () => {
  it('route creation', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          component,
          meta: {
            requiresAuth: true,
            lol: true,
            nested: {
              foo: 'bar',
            },
          },
        },
      ],
    })

    router.addRoute({
      path: '/foo',
      component,
      meta: {
        nested: {
          foo: 'foo',
        },
      },
    })
  })

  it('route location in guards', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [],
    })
    router.beforeEach(to => {
      expectTypeOf<{ requiresAuth?: Boolean; nested?: { foo: string } }>(
        to.meta
      )
      expectTypeOf<unknown>(to.meta.lol)
      if (to.meta.nested?.foo == 'foo' || to.meta.lol) return false
      return
    })
  })
})
