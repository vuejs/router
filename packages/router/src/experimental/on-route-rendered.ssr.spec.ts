import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { createRouter } from '../router'
import { onRouteRendered } from './on-route-rendered'

describe('onRouteRendered ssr', () => {
  it('does nothing during SSR', async () => {
    const callback = vi.fn()
    const Page = defineComponent({
      setup() {
        onRouteRendered(callback)
      },
      template: '<main>SSR page</main>',
    })
    const Root = defineComponent({
      components: { RouterView },
      setup() {
        onRouteRendered(callback)
      },
      template: '<RouterView />',
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Page },
        { path: '/other', component: Page },
      ],
    })
    const app = createSSRApp(Root)
    app.use(router)
    await router.push('/')
    await router.isReady()

    await expect(renderToString(app)).resolves.toContain('SSR page')
    await router.push('/other')
    expect(callback).not.toHaveBeenCalled()
  })
})
