import type {
  RouteComponent,
  RouteLocationNormalized,
  RouterScrollBehavior,
} from 'vue-router'
import {
  createRouter,
  createWebHistory,
  START_LOCATION,
  useRouter,
} from 'vue-router'
import { createApp, defineComponent, onMounted, onUnmounted, ref } from 'vue'
import {
  ScrollRestoration,
  useScrollRestoration,
} from 'vue-router/experimental'

const Home: RouteComponent = { template: '<div class="home">home</div>' }
const Foo: RouteComponent = { template: '<div class="foo">foo</div>' }
const Bar: RouteComponent = defineComponent({
  template: `
    <div class="bar">
      bar
      <div style="height:1500px"></div>
      <p id="anchor" style="height:500px">Anchor</p>
      <p id="anchor2" style="height:500px">Anchor2</p>
      <p id="1number">with number</p>
    </div>
  `,

  setup() {
    useScrollRestoration()
    const router = useRouter()
    let to: RouteLocationNormalized = router.currentRoute.value
    let from: RouteLocationNormalized | undefined
    const removeAfterEach = router.afterEach((to_, from_) => {
      to = to_
      from = from_
      restoreScroll(to, from || START_LOCATION)
      history.scrollRestoration = 'auto'
    })
    const removeBeforeEach = router.beforeEach((to, from) => {
      history.scrollRestoration = 'manual'
      const savedPosition = {
        top: window.scrollY,
        left: window.scrollX,
      }
      sessionStorage.setItem(from.fullPath, JSON.stringify(savedPosition))
      console.log('saved', from.fullPath, savedPosition)
    })

    onUnmounted(() => {
      removeBeforeEach()
      removeAfterEach
    })
    async function restoreScroll(
      to: RouteLocationNormalized,
      from: RouteLocationNormalized
    ) {
      console.log('Restoring for key', to.fullPath)
      const item = sessionStorage.getItem(to.fullPath)
      const savedPosition = JSON.parse(item || 'null')
      console.log('restore', item, savedPosition)
      const pos = await scrollBehavior(to, from, savedPosition)
      if (pos) {
        console.log('Restoring pos', pos)
      }
    }

    onMounted(() => {
      restoreScroll(to, from || START_LOCATION)
    })

    return {}
  },
})

// scrollBehavior:
// - only available in html5 history mode
// - defaults to no scroll behavior
// - return false to prevent scroll
const scrollBehavior: RouterScrollBehavior = async function (
  to,
  from,
  savedPosition
) {
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

const webHistory = createWebHistory('/scroll-restoration/')
const router = createRouter({
  history: webHistory,
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

const smoothScroll = ref(false)

const app = createApp({
  setup() {
    return {
      smoothScroll,
      hashWithNumber: { path: '/bar', hash: '#1number' },
    }
  },

  template: `
    <h1>Scroll Restoration</h1>
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
      >
        <component :is="Component" />
      </transition>
    </router-view>
  `,
})

app.use(ScrollRestoration, { router })
app.use(router)

router.isReady().then(() => (window.vm = app.mount('#app')))
