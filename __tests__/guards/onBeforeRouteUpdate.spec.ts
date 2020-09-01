/**
 * @jest-environment jsdom
 */
import {
  createRouter,
  createMemoryHistory,
  onBeforeRouteUpdate,
} from '../../src'
import { createApp, defineComponent } from 'vue'

const component = {
  template: '<div>Generic</div>',
}

describe('onBeforeRouteUpdate', () => {
  it('removes update guards when leaving', async () => {
    const spy = jest.fn()
    const WithLeave = defineComponent({
      template: `text`,
      setup() {
        onBeforeRouteUpdate(spy)
      },
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        { path: '/foo', component: WithLeave as any },
      ],
    })
    const app = createApp({
      template: `
      <router-view />
      `,
    })
    app.use(router)
    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)
    app.mount(rootEl)

    await router.isReady()
    await router.push('/foo')
    await router.push('/foo?q')
    await router.push('/')
    await router.push('/foo')
    await router.push('/foo?q')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
