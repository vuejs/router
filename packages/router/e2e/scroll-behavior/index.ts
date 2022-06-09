import '../global.css'
import {
  RouteComponent,
  createRouter,
  createWebHistory,
  RouterScrollBehavior,
} from 'vue-router'
import { createApp, ref } from 'vue'
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
const scrollBehavior: RouterScrollBehavior = async function (
  to,
  from,
  savedPosition
) {
  await scrollWaiter.promise

  const behavior: ScrollOptions['behavior'] = smoothScroll.value
    ? 'smooth'
    : 'auto'

  if (savedPosition) {
    // savedPosition is only available for popstate navigations.
    return { ...savedPosition, behavior }
  } else {
    let position: ReturnType<RouterScrollBehavior>

    // scroll to anchor by returning the selector
    if (to.hash) {
      position = { el: to.hash, behavior }

      // specify offset of the element
      if (to.hash === '#anchor2') {
        position.top = 100
        position.behavior = behavior
      }

      return position
    }

    // check if any matched route config has meta that requires scrolling to top
    if (to.meta.scrollToTop) {
      // coords will be used if no selector is provided,
      // or if the selector didn't match any element.
      return { left: 0, top: 0, behavior }
    }

    return false
  }
}

const webHistory = createWebHistory('/scroll-behavior')
const router = createRouter({
  history: webHistory,
  scrollBehavior,
  routes: [
    { path: '/', component: Home, meta: { scrollToTop: true } },
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar, meta: { scrollToTop: true } },
  ],
})

declare module '../../src' {
  export interface RouteMeta {
    scrollToTop?: boolean
  }
}

scrollWaiter.add()

const smoothScroll = ref(false)

const app = createApp({
  setup() {
    return {
      smoothScroll,
      hashWithNumber: { path: '/bar', hash: '#1number' },
      flushWaiter: scrollWaiter.flush,
      setupWaiter: scrollWaiter.add,
    }
  },

  // because we don't have an appear prop on transition, we need to manually trigger these
  mounted() {
    scrollWaiter.flush()
  },

  template: `
    <h1>Scroll Behavior</h1>
    <ul>
      <li><router-link to="/">/</router-link></li>
      <li><router-link to="/foo">/foo</router-link></li>
      <li><router-link to="/bar">/bar</router-link></li>
      <li><router-link to="/bar#anchor">/bar#anchor</router-link></li>
      <li><router-link to="/bar#anchor2">/bar#anchor2</router-link></li>
      <li><router-link :to="hashWithNumber">/bar#1number</router-link></li>
    </ul>
    <label>
    <input type="checkbox" v-model="smoothScroll"> Use smooth scroll
    </label>
    <router-view class="view" v-slot="{ Component }">
      <transition
        name="fade"
        mode="out-in"
        @before-enter="flushWaiter"
        @before-leave="setupWaiter"
      >
        <component :is="Component" />
      </transition>
    </router-view>
  `,
})
app.use(router)

router.isReady().then(() => (window.vm = app.mount('#app')))
