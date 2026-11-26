import { computed, createApp, defineComponent, h, Suspense } from 'vue'
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  RouterView,
  START_LOCATION,
  useRoute,
} from 'vue-router'
import {
  experimental_createRouter,
  createFixedResolver,
  normalizeRouteRecord,
  MatcherPatternPathStatic,
  ScrollRestoration,
  useScrollRestoration,
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
} from 'vue-router/experimental'

const config = new URLSearchParams(location.search)
const scrolls: Array<() => void> = []
const trace: unknown[] = []
const pending = Promise.withResolvers<void>()
function page(slow = false) {
  return defineComponent({
    setup() {
      const route = useRoute()
      const { scroll } = useScrollRestoration({
        manual: config.has('manual'),
      })
      scrolls.push(scroll)
      const render = () => h('main', { 'data-page': route.path }, route.path)
      return slow ? pending.promise.then(() => render) : render
    },
  })
}
const pages = { '/a': page(), '/b': page(), '/slow': page(true) }
const history = config.has('hash')
  ? createWebHashHistory('/scroll-restoration-route-prop/')
  : createWebHistory('/scroll-restoration-route-prop/')
const router = config.has('experimental')
  ? experimental_createRouter({
      history,
      resolver: createFixedResolver(
        Object.entries(pages).map(([path, component]) =>
          normalizeRouteRecord({
            name: path,
            path: new MatcherPatternPathStatic(path),
            components: { default: component },
          })
        )
      ),
    })
  : createRouter({
      history,
      routes: Object.entries(pages).map(([path, component]) => ({
        path,
        component,
      })),
    })
const app = createApp({
  setup() {
    const displayed = computed(() =>
      config.has('background')
        ? router.resolve('/a')
        : router.currentRoute.value === START_LOCATION
          ? undefined
          : router.resolve(router.currentRoute.value.fullPath)
    )
    return () =>
      h(RouterView, config.has('plain') ? {} : { route: displayed.value }, {
        default: ({ Component }) =>
          Component
            ? h(Suspense, { timeout: 0 }, { default: () => Component })
            : null,
      })
  },
})
app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore(entry, to, context) {
    trace.push({ ...context, displayed: to.path })
    SCROLL_RESTORATION_RESTORE_DEFAULT(entry, to)
  },
})
app.use(router)
app.mount('#app')
Object.assign(window, {
  routePropRouter: router,
  routePropTrace: trace,
  routePropScrolls: scrolls,
  routePropRelease: () => pending.resolve(),
  routePropUnmount: () => app.unmount(),
})
