import { describe, expectTypeOf, it } from 'vitest'
import { defineComponent } from 'vue'
import { defineBasicLoader } from './defineLoader'
import type { UseDataLoader } from './createDataLoader'
import { createRouter } from '../../router'
import { createMemoryHistory } from '../../history/memory'

describe('meta-extensions', () => {
  it('works when adding routes', () => {
    const component = defineComponent({})
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        // empty
        {
          path: '/',
          component,
          meta: {
            loaders: [],
            nested: { foo: 'bar' },
          },
        },

        // mixed
        {
          path: '/',
          component,
          meta: {
            loaders: [
              defineBasicLoader(async () => ({ name: 'foo' })),
              defineBasicLoader(async () => ({ name: 'foo' }), {}),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
            ],
            nested: { foo: 'bar' },
          },
        },

        // only lazy: true
        {
          path: '/',
          component,
          meta: {
            loaders: [
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
            ],
            nested: { foo: 'bar' },
          },
        },

        // only lazy: false
        {
          path: '/',
          component,
          meta: {
            loaders: [
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
            ],
            nested: { foo: 'bar' },
          },
        },
      ],
    })

    router.addRoute({
      path: '/',
      component,
      meta: {
        loaders: [
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
        ],
        nested: { foo: 'bar' },
      },
    })

    router.addRoute({
      path: '/',
      component,
      meta: {
        loaders: [
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
        ],
        nested: { foo: 'bar' },
      },
    })
  })

  it('works when checking the type of meta', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [],
    })

    expectTypeOf<UseDataLoader[] | undefined>(
      router.currentRoute.value.meta.loaders
    )
  })
})
