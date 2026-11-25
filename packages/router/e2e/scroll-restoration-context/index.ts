import { createApp, defineComponent, onScopeDispose } from 'vue'
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  useRoute,
  START_LOCATION,
  RouterView,
  RouterLink,
} from 'vue-router'
import {
  experimental_createRouter,
  createFixedResolver,
  normalizeRouteRecord,
  MatcherPatternPathStatic,
  MatcherPatternPathDynamic,
  type ParamParser,
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
const config = new URLSearchParams(location.search)
if (config.has('experimental'))
  sessionStorage.setItem('context-experimental', 'yes')
const experimental = sessionStorage.getItem('context-experimental') === 'yes'
const history = config.has('hash')
  ? createWebHashHistory('/scroll-restoration-context/')
  : createWebHistory('/scroll-restoration-context/')
const numberParser: ParamParser<number, string> = { get: Number, set: String }
const numbersParser: ParamParser<number[], string[]> = {
  get: values => values.map(Number),
  set: values => values.map(String),
}
const router = experimental
  ? experimental_createRouter({
      history,
      resolver: createFixedResolver([
        ...['/a', '/b', '/blocked'].map(path =>
          normalizeRouteRecord({
            name: path,
            path: new MatcherPatternPathStatic(path),
            components: { default: Page },
          })
        ),
        normalizeRouteRecord({
          name: 'number',
          path: new MatcherPatternPathDynamic(
            /^\/number\/([^/]+)$/,
            { id: [numberParser] },
            ['number', 1]
          ),
          components: { default: Page },
        }),
        normalizeRouteRecord({
          name: 'numbers',
          path: new MatcherPatternPathDynamic(
            /^\/numbers\/(.+)$/,
            { id: [numbersParser, true] },
            ['numbers', 1]
          ),
          components: { default: Page },
        }),
      ]),
    })
  : createRouter({
      history,
      routes: [
        { path: '/', redirect: '/a' },
        { path: '/a', component: Page },
        { path: '/b', component: Page },
        { path: '/blocked', component: Page },
        { path: '/parts/:segments+', component: Page },
        { path: '/redirect', redirect: '/b' },
      ],
    })
router.beforeEach(to =>
  to.path === '/blocked' ||
  (to.path === '/b' &&
    sessionStorage.getItem('context-abort-initial') === 'yes')
    ? false
    : undefined
)
const readiness = { aborted: false, atStart: false, failureType: 0 }

const app = createApp({
  components: { RouterView, RouterLink },
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
router.isReady().catch(error => {
  readiness.aborted = true
  readiness.failureType = error.type
  readiness.atStart = router.currentRoute.value === START_LOCATION
})
Object.assign(window, {
  contextTrace: trace,
  contextRouter: router,
  contextReadiness: readiness,
})
