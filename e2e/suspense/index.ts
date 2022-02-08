import '../global.css'
import {
  createRouter,
  createWebHistory,
  onBeforeRouteUpdate,
  onBeforeRouteLeave,
  RouterView,
  useRoute,
} from '../../src'
import {
  createApp,
  ref,
  reactive,
  defineComponent,
  FunctionalComponent,
  h,
  Suspense,
  onErrorCaptured,
} from 'vue'

const Home = defineComponent({
  template: `
    <div>
      <h2>Home</h2>
    </div>
  `,
})

const logs = ref<string[]>([])

const state = reactive({
  enter: 0,
  update: 0,
  leave: 0,
})

const delay = (t: number) => new Promise(r => setTimeout(r, t))

/**
 * creates a component that logs the guards and that can also return a promise
 * in `setup()`
 *
 * @param name
 */
function createTestComponent(key: string, isAsync = false) {
  return defineComponent({
    name: key,
    template: `<div id="${key}">${key}</div>`,

    setup() {
      onBeforeRouteUpdate((to, from) => {
        logs.value.push(
          `${key}: setup:update ${from.fullPath} - ${to.fullPath}`
        )
      })
      onBeforeRouteLeave((to, from) => {
        logs.value.push(`${key}: setup:leave ${from.fullPath} - ${to.fullPath}`)
      })

      const route = useRoute()
      const shouldFail = !!route.query.fail

      return isAsync
        ? delay(1000).then(() =>
            shouldFail ? Promise.reject(new Error('failed')) : {}
          )
        : {}
    },
  })
}

const Foo = createTestComponent('Foo')
const FooAsync = createTestComponent('FooAsync', true)

// A Pass Through view that just renders a router view to allow nested routes to
// just reuse the path without using the layout system it can provide
const PassThroughView: FunctionalComponent = () => h(RouterView)
PassThroughView.displayName = 'RouterView'

const PassThroughViewSuspense: FunctionalComponent = (_, { emit }) =>
  h(RouterView, null, {
    default: ({ Component }: any) =>
      h(
        Suspense,
        {
          onPending: () => emit('pending'),
          onResolve: () => emit('resolve'),
          timeout: 500,
        },
        {
          default: () => h(Component),
          fallback: () => h('p', 'Loading nested...'),
        }
      ),
  })

PassThroughViewSuspense.displayName = 'PTVS'
PassThroughViewSuspense.emits = ['pending', 'resolve']

const webHistory = createWebHistory('/suspense')
const router = createRouter({
  history: webHistory,
  routes: [
    { path: '/', component: Home },
    {
      path: '/foo',
      component: Foo,
    },
    {
      path: '/foo-async',
      component: FooAsync,
    },
    {
      path: '/nested',
      component: PassThroughView,
      children: [
        { path: 'one', component: createTestComponent('one', true) },
        { path: 'two', component: createTestComponent('two', true) },
      ],
    },
    {
      path: '/nested-suspense',
      component: PassThroughViewSuspense,
      children: [
        { path: 'one', component: createTestComponent('one', true) },
        { path: 'two', component: createTestComponent('two', true) },
      ],
    },
  ],
})

const shouldFail = ref(false)

const app = createApp({
  template: `
    <h1>Suspense</h1>

    <pre>
route: {{ $route.fullPath }}
enters: {{ state.enter }}
updates: {{ state.update }}
leaves: {{ state.leave }}
    </pre>

    <label><input type="checkbox" v-model="shouldFail"> Fail next async</label>

    <br>

    <pre id="logs" v-if="TODO">{{ logs.join('\\n') }}</pre>

    <button id="resetLogs" @click="logs = []">Reset Logs</button>

    <ul>
      <li><router-link to="/">/</router-link></li>
      <li><router-link to="/foo">/foo</router-link></li>
      <li><router-link to="/foo-async">/foo-async</router-link></li>
      <li><router-link id="update-query" :to="{ query: { n: (Number($route.query.n) || 0) + 1 }}" v-slot="{ route }">{{ route.fullPath }}</router-link></li>
      <li><router-link to="/nested/one">/nested/one</router-link></li>
      <li><router-link to="/nested/two">/nested/two</router-link></li>
      <li><router-link to="/nested-suspense/one">/nested-suspense/one</router-link></li>
      <li><router-link to="/nested-suspense/two">/nested-suspense/two</router-link></li>
    </ul>

    <router-view v-slot="{ Component, route }" >
      <Suspense @pending="log('pending')" @resolve="resolvePending" :timeout="500">
        <component :is="Component" class="view" />
        <template #fallback>
          <p>Loading root...</p>
        </template>
      </Suspense>
    </router-view>
  `,
  setup() {
    onErrorCaptured(error => {
      console.warn('Error captured', error)
      rejectPending(error)
      return false
    })

    function resolvePending() {
      console.log('resolve')
      pendingContext?.resolve()
    }

    function rejectPending(err: any) {
      pendingContext?.reject(err)
    }

    return {
      state,
      logs,
      log: console.log,
      resolvePending,
      shouldFail,
      // TODO: remove after showing tests
      TODO: true,
      createPendingContext,
    }
  },
})

router.beforeEach(to => {
  console.log('beforeEach')
  if (shouldFail.value && !to.query.fail)
    return { ...to, query: { ...to.query, fail: 'yes' } }
  return
})
app.use(router)

window.r = router

app.mount('#app')

// code to handle the pending context on suspense

router.beforeEach(async () => {
  // const pending = createPendingContext()
  // await pending.promise
})

interface PendingContext {
  resolve(): void
  reject(error?: any): void

  promise: Promise<void>
}

let pendingContext: PendingContext | null = null

function createPendingContext(): PendingContext {
  // reject any ongoing pending navigation
  if (pendingContext) {
    pendingContext.reject(new Error('New Navigation'))
  }

  let resolve: PendingContext['resolve']
  let reject: PendingContext['reject']
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  pendingContext = { promise, resolve: resolve!, reject: reject! }

  return pendingContext
}
