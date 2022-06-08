import { createRouter, createWebHistory, expectType } from './index'
import { createApp, defineComponent } from 'vue'

const component = defineComponent({})

declare module './index' {
  interface RouteMeta {
    requiresAuth?: boolean
    nested: { foo: string }
  }
}

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
    {
      path: '/foo',
      component,
      // @ts-expect-error
      meta: {},
    },
  ],
})

router.beforeEach(to => {
  expectType<{ requiresAuth?: Boolean; nested: { foo: string } }>(to.meta)
  expectType<unknown>(to.meta.lol)
  if (to.meta.nested.foo == 'foo' || to.meta.lol) return false
})

const app = createApp({})
app.use(router)
