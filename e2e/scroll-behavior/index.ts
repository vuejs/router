import { createRouter, createWebHistory, ScrollBehavior } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp } from 'vue'
import { scrollWaiter } from './scrollWaiter'

const Home: RouteComponent = { template: '<div class="home">home</div>' }
const Foo: RouteComponent = { template: '<div class="foo">foo</div>' }
const Bar: RouteComponent = {
  template: `
    <div class="bar">
      bar
      <div style="height:1500px"></div>
      <p id="anchor" style="height:500px">Anchor</p>
      <p id="anchor2" style="height:500px">Anchor2</p>
      <p id="1number">with number</p>
    </div>
  `,
}

// scrollBehavior:
// - only available in html5 history mode
// - defaults to no scroll behavior
// - return false to prevent scroll
const scrollBehavior: ScrollBehavior = async function(to, from, savedPosition) {
  await scrollWaiter.promise

  if (savedPosition) {
    // savedPosition is only available for popstate navigations.
    return savedPosition
  } else {
    let position: ReturnType<ScrollBehavior>

    // scroll to anchor by returning the selector
    if (to.hash) {
      position = { selector: to.hash }

      // specify offset of the element
      if (to.hash === '#anchor2') {
        // TODO: allow partial { y: 100 }
        position.offset = { x: 0, y: 100 }
      }

      // bypass #1number check
      if (/^#\d/.test(to.hash) || document.querySelector(to.hash)) {
        return position
      }

      // if the returned position is falsy or an empty object,
      // will retain current scroll position.
      return false
    }

    // check if any matched route config has meta that requires scrolling to top
    if (to.matched.some(m => m.meta.scrollToTop)) {
      // coords will be used if no selector is provided,
      // or if the selector didn't match any element.
      return { x: 0, y: 0 }
    }

    return false
  }
}

const webHistory = createWebHistory('/' + __dirname)
const router = createRouter({
  history: webHistory,
  scrollBehavior,
  routes: [
    { path: '/', component: Home, meta: { scrollToTop: true } },
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar, meta: { scrollToTop: true } },
  ],
})
const app = createApp({
  setup() {
    return {
      flushWaiter: scrollWaiter.flush,
      setupWaiter: scrollWaiter.add,
    }
  },
})
app.use(router)

window.vm = app.mount('#app')
