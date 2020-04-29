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
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('invokes with the component context with named views', async () => {
    expect.assertions(2)
    const WithLeaveOne = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteLeave: jest
        .fn()
        .mockImplementationOnce(function (this: any, to, from, next) {
          expect(typeof this.counter).toBe('number')
          next()
        }),
    })
    const WithLeaveTwo = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteLeave: jest
        .fn()
        .mockImplementationOnce(function (this: any, to, from, next) {
          expect(typeof this.counter).toBe('number')
          next()
        }),
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        {
          path: '/leave',
          components: {
            one: WithLeaveOne as any,
            two: WithLeaveTwo as any,
          },
        },
      ],
    })
    const app = createApp({
      template: `
      <router-view name="one" />
      <router-view name="two" />
      `,
    })
    app.use(router)
    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)
    app.mount(rootEl)

    await router.isReady()
    await router.push('/leave')
    await router.push('/')
  })

  it('invokes with the component context with nested views', async () => {
    expect.assertions(2)
    const WithLeaveParent = defineComponent({
      template: `<router-view/>`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteLeave: jest
        .fn()
        .mockImplementationOnce(function (this: any, to, from, next) {
          expect(typeof this.counter).toBe('number')
          next()
        }),
    })
    const WithLeave = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteLeave: jest
        .fn()
        .mockImplementationOnce(function (this: any, to, from, next) {
          expect(typeof this.counter).toBe('number')
          next()
        }),
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        {
          path: '/leave',
          component: WithLeaveParent as any,
          children: [
            {
              path: '',
              component: WithLeave as any,
            },
          ],
        },
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
  })

  it('invokes with the component context with nested named views', async () => {
    expect.assertions(3)
    const WithLeaveParent = defineComponent({
      template: `
      <router-view name="one"/>
      <router-view name="two"/>
      `,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteLeave: jest
        .fn()
        .mockImplementationOnce(function (this: any, to, from, next) {
          expect(typeof this.counter).toBe('number')
          next()
        }),
    })
    const WithLeaveOne = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteLeave: jest
        .fn()
        .mockImplementationOnce(function (this: any, to, from, next) {
          expect(typeof this.counter).toBe('number')
          next()
        }),
    })
    const WithLeaveTwo = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteLeave: jest
        .fn()
        .mockImplementationOnce(function (this: any, to, from, next) {
          expect(typeof this.counter).toBe('number')
          next()
        }),
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        {
          path: '/leave',
          component: WithLeaveParent as any,
          children: [
            {
              path: '',
              components: {
                one: WithLeaveOne as any,
                two: WithLeaveTwo as any,
              },
            },
          ],
        },
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
  })
})

describe('beforeRouteUpdate', () => {
  it('invokes with the component context', async () => {
    expect.assertions(2)
    const spy = jest
      .fn()
      .mockImplementationOnce(function (this: any, to, from, next) {
        expect(typeof this.counter).toBe('number')
        next()
      })
    const WithParam = defineComponent({
      template: `text`,
      // we use data to check if the context is the right one because saving `this` in a variable logs a few warnings
      data: () => ({ counter: 0 }),
      beforeRouteUpdate: spy,
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component },
        { path: '/:id', component: WithParam },
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
    await router.push('/one')
    await router.push('/foo')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
