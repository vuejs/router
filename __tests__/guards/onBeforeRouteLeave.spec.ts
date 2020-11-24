/**
 * @jest-environment jsdom
 */
import {
  createRouter,
  createMemoryHistory,
  onBeforeRouteLeave,
} from '../../src'
import { createApp, defineComponent } from 'vue'

const component = {
  template: '<div>Generic</div>',
}

describe('onBeforeRouteLeave', () => {
  it('removes guards when leaving the route', async () => {
    const spy = jest.fn()
    const WithLeave = defineComponent({
      template: `text`,
      setup() {
        onBeforeRouteLeave(spy)
      },
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        { path: '/leave', component: WithLeave as any },
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
    await router.push('/leave')
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(1)
    await router.push('/leave')
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
