/**
 * @vitest-environment node
 */
import { createRouter } from '../src/router'
import { createMemoryHistory } from '../src/history/memory'
import { createRouterMatcher } from '../src/matcher'
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from '../src/navigationGuards'
import { RouterView } from '../src/RouterView'
import type { Component } from 'vue'
import { createSSRApp, defineComponent, h, resolveComponent } from 'vue'
import {
  renderToString,
  ssrInterpolate,
  ssrRenderComponent,
} from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t))

describe('SSR', () => {
  const Home = {
    ssrRender(ctx: any, push: any) {
      push('Home')
    },
  }
  const Page = {
    ssrRender(ctx: any, push: any) {
      push(`${ssrInterpolate(ctx.$route.fullPath)}`)
    },
  }

  const AsyncPage = async () => {
    await delay(10)
    return Page
  }

  it('works', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home },
        {
          path: '/:id',
          component: Page,
        },
      ],
    })
    const App = {
      ssrRender(ctx: any, push: any, parent: any) {
        push(
          ssrRenderComponent(
            resolveComponent('router-view') as Component,
            null,
            null,
            parent
          )
        )
      },
    }
    const app = createSSRApp(App)
    app.use(router)
    // const rootEl = document.createElement('div')
    // document.body.appendChild(rootEl)

    router.push('/hello')
    await router.isReady()

    const xxx = await renderToString(app)
    expect(xxx).toMatchInlineSnapshot(`"/hello"`)
  })

  it('handles async components', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Home },
        {
          path: '/:id',
          component: AsyncPage,
        },
      ],
    })
    const App = {
      ssrRender(ctx: any, push: any, parent: any) {
        push(
          ssrRenderComponent(
            resolveComponent('router-view') as Component,
            null,
            null,
            parent
          )
        )
      },
    }
    const app = createSSRApp(App)
    app.use(router)
    // const rootEl = document.createElement('div')
    // document.body.appendChild(rootEl)

    router.push('/hello')
    await router.isReady()

    const xxx = await renderToString(app)
    expect(xxx).toMatchInlineSnapshot(`"/hello"`)
  })

  it('does not keep in-component guards on a shared matcher', async () => {
    const GuardedPage = defineComponent({
      setup() {
        onBeforeRouteLeave(() => {})
        onBeforeRouteUpdate(() => {})
        return () => h('div', 'page')
      },
    })
    const matcher = createRouterMatcher(
      [{ path: '/', component: GuardedPage }],
      {}
    )

    for (let i = 0; i < 3; i++) {
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [],
        matcher,
      })
      const app = createSSRApp({ render: () => h(RouterView) })
      app.use(router)
      router.push('/')
      await router.isReady()
      expect(await renderToString(app)).toBe('<div>page</div>')
    }

    // components are never unmounted on the server, so guards added during a render would
    // stay on the shared record and run in later requests
    const { record } = matcher.getRoutes()[0]
    expect(record.leaveGuards.size).toBe(0)
    expect(record.updateGuards.size).toBe(0)
  })
})
