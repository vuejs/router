import { createApp, defineComponent, onScopeDispose } from 'vue'
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  useRoute,
} from 'vue-router'
import {
  ScrollRestoration,
  useScrollRestoration,
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
} from 'vue-router/experimental'

const trace: unknown[] = []
const Page = defineComponent({
  setup() {
    const route = useRoute()
    const { scroll } = useScrollRestoration({
      manual: () => 'manual' in route.query,
      key(route, context) {
        return `${route.path}${route.hash}:${context.historyPosition}`
      },
    })
    const ready = () => scroll()
    window.addEventListener('data-ready', ready)
    onScopeDispose(() => window.removeEventListener('data-ready', ready))
  },
  template: '<main :data-page="$route.path">{{ $route.path }}</main>',
})
const router = createRouter({
  history: new URLSearchParams(location.search).has('hash')
    ? createWebHashHistory('/scroll-restoration-context/')
    : createWebHistory('/scroll-restoration-context/'),
  routes: [
    { path: '/', redirect: '/a' },
    { path: '/a', component: Page },
    { path: '/b', component: Page },
    { path: '/parts/:segments+', component: Page },
    { path: '/redirect', redirect: '/b' },
  ],
})
const app = createApp({
  template: `<nav><router-link to="/a">a</router-link> <router-link to="/b">b</router-link></nav><router-view />`,
})
app.use(ScrollRestoration, {
  router,
  capture(context) {
    trace.push({ phase: 'capture', ...context })
    return SCROLL_RESTORATION_CAPTURE_DEFAULT()
  },
  restore(entry, route, context) {
    trace.push({ phase: 'restore', ...context })
    SCROLL_RESTORATION_RESTORE_DEFAULT(
      context.type === 'push' || context.type === 'replace' ? null : entry,
      route
    )
  },
})
app.use(router)
app.mount('#app')
Object.assign(window, { contextTrace: trace, contextRouter: router })
