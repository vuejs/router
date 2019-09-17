import Vue from 'vue'
import Router from '../../src'
import { components } from '../utils'

import { createRenderer } from 'vue-server-renderer'
import { RouterOptions } from '../../src/router'

Vue.use(Router)

export const renderer = createRenderer()

export function createRouter(options?: Partial<RouterOptions>) {
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
    ...options,
  })
}

export function createApp(
  routerOptions?: Partial<RouterOptions>,
  options?: any
) {
  // create router instance
  const router = createRouter(routerOptions)

  const app = new Vue({
    // @ts-ignore
    router,
    template: `<div>
      <router-view/>
      </div>`,
    ...options,
    // render: h => h('div', {}, [h('RouterView')]),
  })

  // return both the app and the router
  return { app, router }
}

export function renderApp(
  context: { url: string },
  routerOptions?: Partial<RouterOptions>,
  vueOptions?: any
) {
  return new Promise<ReturnType<typeof createApp>['app']>((resolve, reject) => {
    const { app, router } = createApp(routerOptions, vueOptions)

    // set server-side router's location
    router.push(context.url).catch(err => {})

    // wait until router has resolved possible async components and hooks
    // TODO: rename the promise one to isReady
    router.onReady().then(() => {
      // const matchedComponents = router.getMatchedComponents()
      const matchedComponents = router.currentRoute.matched
      // no matched routes, reject with 404
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }

      // the Promise should resolve to the app instance so it can be rendered
      resolve(app)
    }, reject)
  })
}
