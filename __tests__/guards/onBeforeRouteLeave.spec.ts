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
  it('invokes with the component context', async () => {
    expect.assertions(2)
    const spy = jest
      .fn()
      .mockImplementationOnce(function (this: any, to, from, next) {
        expect(typeof this.counter).toBe('number')
        next()
      })
    const WithLeave = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
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
  })

  it('removes guards when leaving the route', async () => {
    expect.assertions(3)
    const spy = jest
      .fn()
      .mockImplementation(function (this: any, to, from, next) {
        expect(typeof this.counter).toBe('number')
        next()
      })
    const WithLeave = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
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
    await router.push('/leave')
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
