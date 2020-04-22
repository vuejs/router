/**
 * @jest-environment jsdom
 */
import { createRouter, createMemoryHistory } from '../../src'
import { createApp, defineComponent } from 'vue'

const component = {
  template: '<div>Generic</div>',
}

describe('beforeRouteLeave', () => {
  it('invokes with the component context', async () => {
    let componentInstance: any
    const spy = jest
      .fn()
      .mockImplementationOnce(function(this: any, to, from, next) {
        expect(this).toBe(componentInstance)
        next()
      })
    const WithLeave = defineComponent({
      template: `text`,
      created() {
        componentInstance = this
      },
      beforeRouteLeave: spy,
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
    await router.push('/').catch(() => {})
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it.todo('invokes with the component context with named views')
  it.todo('invokes with the component context with nested views')
  it.todo('invokes with the component context with nested named views')
})
