/**
 * @jest-environment node
 */
import { createRouter, createMemoryHistory } from '../src'
import { createSSRApp, resolveComponent, Component } from 'vue'
import {
  renderToString,
  ssrInterpolate,
  ssrRenderComponent,
} from '@vue/server-renderer'

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
})
