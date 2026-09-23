import { renderToString } from '@vue/server-renderer'
import { createSSRApp, defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { createRouter } from '../router'
import { ScrollRestoration, useScrollRestoration } from './scroll-restoration'

describe('ssr', () => {
  it('does nothing during SSR', async () => {
    const Page = defineComponent({
      setup() {
        const { scroll } = useScrollRestoration()
        scroll()
      },
      template: '<main>SSR page</main>',
    })
    const Root = defineComponent({
      components: { RouterView },
      template: '<RouterView />',
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: Page }],
    })
    const app = createSSRApp(Root)

    app.use(ScrollRestoration, { router })
    app.use(router)
    await router.push('/')
    await router.isReady()

    await expect(renderToString(app)).resolves.toContain('SSR page')
  })
})
