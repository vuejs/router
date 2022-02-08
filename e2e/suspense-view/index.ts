import '../global.css'
import {
  createRouter,
  createWebHistory,
  onBeforeRouteUpdate,
  onBeforeRouteLeave,
  useRoute,
  SusRouterView,
} from '../../src'
import {
  createApp,
  ref,
  reactive,
  defineComponent,
  FunctionalComponent,
  h,
  onErrorCaptured,
  defineAsyncComponent,
} from 'vue'

const Home = defineComponent({
  name: 'Home',
  template: `
    <div>
      <h2>Home</h2>
    </div>
  `,
})

const delay = (t: number) => new Promise(r => setTimeout(r, t))

const AsyncImport = defineAsyncComponent(async () => {
  await delay(1000)
  console.log('finished loading async component')
  return defineComponent({
    name: 'AsyncImport',
    beforeMount() {
      console.log('done')
    },
    template: `<div>AsyncImport</div>`,
  })
})

const n = ref(0)

setInterval(() => {
  n.value++
}, 1000)

/**
 * creates a component that logs the guards
 * @param name
 */
function createAsyncComponent(key: string, isAsync = true) {
  return defineComponent({
    name: key,
    components: { AsyncImport },
    template: `<div id="${key}">${key}: n = {{n}}.<AsyncImport v-if="${isAsync}" /></div>`,

    setup() {
      const route = useRoute()
      const shouldFail = !!route.query.fail

      console.log(`Setup of ${key}...`)

      const ret = { n }

      return isAsync
        ? delay(2000).then(() => {
            console.log(`finished setup of ${key}`)

            return shouldFail ? Promise.reject(new Error('failed')) : ret
          })
        : ret
    },
  })
}

function createAsyncNestedComponent(key: string) {
  return defineComponent({
    name: key,
    template: `<div id="${key}">${key}:
    <SusRouterView @pending="log('⏳ (nested ${key}) pending', $event)" @resolve="log('✅ (nested ${key}) resolve', $event)">
      <template #fallback>
        Loading...
      </template>
      <template v-slot="{ Component }">
        <component :is="Component" class="view" />
      </template>
    </SusRouterView>
    </div>`,

    setup() {
      const route = useRoute()
      const shouldFail = !!route.query.fail

      console.log(`Setup of ${key}...`)

      return delay(100).then(() =>
        shouldFail ? Promise.reject(new Error('failed')) : {}
      )
    },
  })
}

const Foo = createAsyncComponent('Foo', false)
const FooAsync = createAsyncComponent('FooAsync')
const PassThroughView: FunctionalComponent = () => h(SusRouterView)
PassThroughView.displayName = 'SusRouterView'

const webHistory = createWebHistory('/suspense-view')
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
        { path: 'foo', component: Foo },
        { path: 'foo-async', component: FooAsync },
      ],
    },
    {
      path: '/nested-async',
      component: createAsyncNestedComponent('NestedAsync'),
      children: [
        { path: 'foo', component: Foo },
        { path: 'foo-async', component: FooAsync },
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
    </pre>

    <label><input type="checkbox" v-model="shouldFail"> Fail next async</label>

    <button @click="clear()">Clear logs</button>

    <ul>
      <li><router-link to="/">/</router-link></li>
      <li><router-link to="/foo">/foo</router-link></li>
      <li><router-link to="/foo-async">/foo-async</router-link></li>
      <li><router-link id="update-query" :to="{ query: { n: (Number($route.query.n) || 0) + 1 }}" v-slot="{ route }">{{ route.fullPath }}</router-link></li>
      <li><router-link to="/nested/foo">Nested with sync child</router-link></li>
      <li><router-link to="/nested/foo-async">Nested with async child</router-link></li>
      <li><router-link to="/nested-async/foo">Nested async with sync child</router-link></li>
      <li><router-link to="/nested-async/foo-async">Nested async with async child</router-link></li>
    </ul>

    <SusRouterView @pending="log('⏳ pending', $event)" @resolve="log('✅ resolve', $event)">
      <template #fallback>
        Loading...
      </template>
      <template v-slot="{ Component }">
        <component :is="Component" class="view" />
      </template>
    </SusRouterView>
  `,
  setup() {
    onErrorCaptured(err => {
      console.log('❌ From Suspense', err)
    })
    return { clear: console.clear, shouldFail }
  },
})
app.component('SusRouterView', SusRouterView)
app.config.globalProperties.log = console.log

router.beforeEach((to, from) => {
  console.log('-'.repeat(10))
  console.log(`🏎 ${from.fullPath} -> ${to.fullPath}`)
  if (shouldFail.value && !to.query.fail)
    return { ...to, query: { ...to.query, fail: 'yes' } }
  return
})
router.afterEach((to, from, failure) => {
  if (failure) {
    console.log(`🛑 ${from.fullPath} -> ${to.fullPath}`)
  } else {
    console.log(`🏁 ${from.fullPath} -> ${to.fullPath}`)
  }
})
router.onError((error, to, from) => {
  console.log(`💥 ${from.fullPath} -> ${to.fullPath}`)
  console.error(error)
  console.log('-'.repeat(10))
})
app.use(router)

app.mount('#app')

window.r = router
