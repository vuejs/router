import { createApp, defineComponent, h } from 'vue'
import {
  createRouter,
  createWebHistory,
  RouterView,
  START_LOCATION,
} from 'vue-router'
import {
  experimental_createRouter,
  createFixedResolver,
  normalizeRouteRecord,
  MatcherPatternPathStatic,
  ScrollRestoration,
  useScrollRestoration,
} from 'vue-router/experimental'
const cfg = new URLSearchParams(location.search),
  kind = cfg.get('kind'),
  host = cfg.get('host'),
  seeded = cfg.get('seeded') === 'yes'
const trace: any[] = []
let capture!: () => void
let manual!: () => void
const Page = defineComponent({
  setup() {
    manual = useScrollRestoration({ manual: true, key: 'page' }).scroll
    return () => h('main', 'background-page')
  },
})
function makeRouter() {
  const history = createWebHistory('/scroll-restoration-isolation/')
  const paths = ['/', '/alpha', '/blocked', '/beta']
  return kind === 'classic'
    ? createRouter({
        history,
        routes: paths.map(path => ({ path, component: Page })),
      })
    : experimental_createRouter({
        history,
        resolver: createFixedResolver(
          paths.map(path =>
            normalizeRouteRecord({
              name: path,
              path: new MatcherPatternPathStatic(path),
              components: { default: Page },
            })
          )
        ),
      })
}
const routerA = makeRouter(),
  routerB = makeRouter()
let appA: any
if (seeded) {
  await routerA.push('/alpha')
  appA = createApp({ render: () => h(RouterView) })
  appA.use(ScrollRestoration, {
    router: routerA,
    storageKeyPrefix: 'independent:A:',
    capture: () => null,
    restore: () => {},
  })
  appA.use(routerA)
  appA.mount('#a')
  await routerA.isReady()
}
const removeGuard = routerB.beforeEach(() => false)
const Sidebar = defineComponent({
  setup() {
    manual = useScrollRestoration({ manual: true, key: 'sidebar' }).scroll
    return () => h('aside', 'documented-sidebar')
  },
})
const background = host === 'background' ? routerB.resolve('/beta') : undefined
const appB = createApp({
  render: () =>
    host === 'background'
      ? h(RouterView, { route: background })
      : [h(Sidebar), h(RouterView)],
})
appB.use(ScrollRestoration, {
  router: routerB,
  storageKeyPrefix: 'independent:B:',
  setupListeners(fn) {
    capture = fn
  },
  capture(context) {
    trace.push({ phase: 'capture', context })
    return null
  },
  restore(_entry, to, context) {
    trace.push({ phase: 'restore', to: to.path, context })
  },
})
appB.use(routerB)
appB.mount('#b')
const failure = await routerB.isReady().catch(error => error)
Object.assign(window, {
  isolationReview: {
    ready: true,
    kind,
    host,
    seeded,
    failure: failure.type,
    atStart: routerB.currentRoute.value === START_LOCATION,
    trace,
    capture: () => capture(),
    scroll: () => manual(),
    release: async () => {
      removeGuard()
      await routerB.push('/beta')
    },
    close: () => {
      appB.unmount()
      appA?.unmount()
      if (!appA) routerA.options.history.destroy()
    },
  },
})
