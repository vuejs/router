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
 * creates a component that logs the guards
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
        ? delay(100).then(() =>
            shouldFail ? Promise.reject(new Error('failed')) : {}
          )
        : {}
    },
  })
}

const Foo = createTestComponent('Foo')
const FooAsync = createTestComponent('FooAsync', true)
const PassThroughView: FunctionalComponent = () => h(RouterView)
PassThroughView.displayName = 'RouterView'

const webHistory = createWebHistory('/' + __dirname)
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

    <pre id="logs">{{ logs.join('\\n') }}</pre>

    <button id="resetLogs" @click="logs = []">Reset Logs</button>

    <ul>
      <li><router-link to="/">/</router-link></li>
      <li><router-link to="/foo">/foo</router-link></li>
      <li><router-link to="/foo-async">/foo-async</router-link></li>
      <li><router-link id="update-query" :to="{ query: { n: (Number($route.query.n) || 0) + 1 }}" v-slot="{ route }">{{ route.fullPath }}</router-link></li>
      <li><router-link to="/nested/one">/nested/one</router-link></li>
      <li><router-link to="/nested/two">/nested/two</router-link></li>
    </ul>

    <router-view v-slot="{ Component }" >
      <Suspense @pending="log('pending')" @resolve="log('resolve')">
        <component :is="Component" class="view" />
      </Suspense>
    </router-view>
  `,
  setup() {
    return { state, logs, log: console.log, shouldFail }
  },
})

router.beforeEach(to => {
  if (shouldFail.value && !to.query.fail)
    return { ...to, query: { ...to.query, fail: 'yes' } }
  return
})
app.use(router)

window.r = router

app.mount('#app')
