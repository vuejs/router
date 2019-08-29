/** @type {import('vue').VueConstructor} */
// @ts-ignore
const Vue = require('vue')
const Router = require('../../src').default
const { components, isMocha } = require('../utils')
const { createRenderer } = require('vue-server-renderer')

describe.skip('SSR: basicRenderer', () => {
  Vue.use(Router)

  function createRouter() {
    // TODO: a more complex routing that can be used for most tests
    return new Router({
      mode: 'history',
      routes: [
        {
          path: '/',
          component: components.Home,
        },
        {
          path: '/foo',
          component: components.Foo,
        },
      ],
    })
  }

  function createApp() {
    // create router instance
    const router = createRouter()

    const app = new Vue({
      // @ts-ignore
      router,
      render: h => h('div', {}, [h('RouterView')]),
    })

    // return both the app and the router
    return { app, router }
  }

  function renderApp(context) {
    return new Promise((resolve, reject) => {
      const { app, router } = createApp()

      // set server-side router's location
      router.push(context.url)

      // wait until router has resolved possible async components and hooks
      // TODO: rename the promise one to isReady
      router.onReady().then(() => {
        // const matchedComponents = router.getMatchedComponents()
        // no matched routes, reject with 404
        if (!matchedComponents.length) {
          return reject({ code: 404 })
        }

        // the Promise should resolve to the app instance so it can be rendered
        resolve(app)
      }, reject)
    })
  }

  it('should work', done => {
    renderToString(
      new Vue({
        template: `
        <div>
          <p class="hi">yoyo</p>
          <div id="ho" :class="{ red: isRed }"></div>
          <span>{{ test }}</span>
          <input :value="test">
          <img :src="imageUrl">
          <test></test>
          <test-async></test-async>
        </div>
      `,
        data: {
          test: 'hi',
          isRed: true,
          imageUrl: 'https://vuejs.org/images/logo.png',
        },
        components: {
          test: {
            render() {
              return this.$createElement('div', { class: ['a'] }, 'test')
            },
          },
          testAsync(resolve) {
            resolve({
              render() {
                return this.$createElement(
                  'span',
                  { class: ['b'] },
                  'testAsync'
                )
              },
            })
          },
        },
      }),
      (err, result) => {
        expect(err).toBeNull()
        expect(result).toContain(
          '<div data-server-rendered="true">' +
            '<p class="hi">yoyo</p> ' +
            '<div id="ho" class="red"></div> ' +
            '<span>hi</span> ' +
            '<input value="hi"> ' +
            '<img src="https://vuejs.org/images/logo.png"> ' +
            '<div class="a">test</div> ' +
            '<span class="b">testAsync</span>' +
            '</div>'
        )
        done()
      }
    )
  })

  // #5941
  it('should work peoperly when accessing $ssrContext in root component', done => {
    let ssrContext
    renderToString(
      new Vue({
        template: `
        <div></div>
      `,
        created() {
          ssrContext = this.$ssrContext
        },
      }),
      err => {
        expect(err).toBeNull()
        expect(ssrContext).toBeUndefined()
        done()
      }
    )
  })
})
