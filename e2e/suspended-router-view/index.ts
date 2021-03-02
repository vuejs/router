import {
  createRouter,
  createWebHistory,
  useRoute,
  viewDepthKey,
} from '../../src'
import {
  computed,
  createApp,
  defineComponent,
  onErrorCaptured,
  inject,
  shallowRef,
} from 'vue'
import {
  NavigationGuardReturn,
  RouteLocationNormalizedLoaded,
} from '../../src/types'

// override existing style on dev with shorter times
if (!__CI__) {
  const transitionDuration = '0.3s'
  const styleEl = document.createElement('style')
  styleEl.innerHTML = `
.fade-enter-active,
.fade-leave-active {
  transition: opacity ${transitionDuration} ease;
}
`
  document.head.append(styleEl)
}

const delay = (t: number) => new Promise(r => setTimeout(r, t))

const Home = defineComponent({
  template: `
  <div>
    <h1>Home</h1>
  </div>`,
})

const ViewRegular = defineComponent({
  template: '<div>Regular</div>',
})

const ViewId = defineComponent({
  template: '<div>Id: {{ $route.params.id }}</div>',
})

const ViewData = defineComponent({
  template: `
  <div>
    <h1>With Data</h1>
    <p>{{ $route.path }}</p>

    <router-view v-slot="{ Component }">
      <transition v-if="Component" name="fade" mode="out-in">
        <suspense :timeout="0" v-bind="suspenseProps">
          <component :is="Component" />
            <template #fallback>
              <p>Loading ViewData...</p>
            </template>
        </suspense>
      </transition>
    </router-view>

  </div>
  `,

  async setup() {
    const depth = inject(viewDepthKey, 0)

    const suspenseProps = createSuspenseProps(`ViewData(${depth})`)

    onErrorCaptured((err, target, info) => {
      console.log(`caught at ViewData(${depth})`, err, target, info)
      // stop propagation
      // return false
    })

    console.log(`wating at ${depth}...`)
    await delay(1000)
    console.log(`done at ${depth}!`)

    if (depth > 1) {
      // throw new Error('oops')
    }

    return { suspenseProps }
  },
})

const router = createRouter({
  history: createWebHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home },
    {
      path: '/data',
      component: ViewData,
      children: [
        { path: '', component: ViewRegular },
        { path: 'data', component: ViewData },
        { path: ':id', name: 'id1', component: ViewId },
      ],
    },
    {
      path: '/data-2',
      component: ViewData,
      children: [
        { path: '', component: ViewRegular },
        { path: 'data', component: ViewData },
        { path: ':id', name: 'id2', component: ViewId },
      ],
    },
  ],
})

function createSuspenseProps(name: string) {
  function onPending() {
    console.log('onPending:' + name)
    console.log('Now remaining', ++remainingValidations)
  }
  function onResolve() {
    console.log('onResolve:' + name)
    if (resolveSuspense) {
      resolveSuspense()
    }
  }
  function onFallback() {
    console.log('onFallback:' + name)
  }

  return { onPending, onResolve, onFallback }
}

let resolveSuspense:
  | ((value?: NavigationGuardReturn) => void)
  | undefined
  | null
let rejectSuspense: ((reason: any) => void) | undefined | null
let pendingRoute = shallowRef<
  RouteLocationNormalizedLoaded | undefined | null
>()
let remainingValidations = 0

router.beforeResolve((to, from) => {
  return new Promise((resolve, reject) => {
    // we need at least one, we increment the rest with onPending
    // should probably be provided and then injected in each routerview to increment the counter
    // then the resolve could decrement and check if it's under 0
    remainingValidations = 1
    if (resolveSuspense) {
      resolveSuspense(false)
    }
    pendingRoute.value = to
    resolveSuspense = () => {
      if (--remainingValidations < 1) {
        pendingRoute.value = null
        resolveSuspense = null
        resolve()
      }
    }
    rejectSuspense = reason => {
      pendingRoute.value = null
      rejectSuspense = null
      reject(reason)
    }

    console.log('pendingRoute set')
  })
})

const app = createApp({
  setup() {
    const route = useRoute()

    onErrorCaptured((err, target, info) => {
      console.log('caught at Root', err, target, info)
      if (rejectSuspense) {
        rejectSuspense(err)
      }
      // stop propagation
      return false
    })

    const nextId = computed(() => (Number(route.params.id) || 0) + 1)
    const suspenseProps = createSuspenseProps('Root')

    return {
      nextId,
      suspenseProps,
      pendingRoute,
    }
  },

  template: `
    <div id="app">
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/data">Suspended</router-link></li>
        <li><router-link to="/data/data">Suspended nested</router-link></li>
        <li><router-link :to="{ name: 'id1', params: { id: nextId }}" v-slot="{ route }">{{ route.fullPath }}</router-link></li>

        <li><router-link to="/data-2">Suspended (2)</router-link></li>
        <li><router-link to="/data-2/data">Suspended nested (2)</router-link></li>
        <li><router-link :to="{ name: 'id2', params: { id: nextId }}" v-slot="{ route }">{{ route.fullPath }}</router-link></li>
      </ul>

      <pre v-if="pendingRoute">Loading {{ pendingRoute.fullPath }} from {{ $route.fullPath }}</pre>

      <router-view v-slot="{ Component }" :route="pendingRoute">
        <transition name="fade" mode="out-in" v-if="Component">
          <suspense :timeout="0" v-bind="suspenseProps">
            <component :is="Component" />
            <template #fallback>
              <p>Loading App...</p>
            </template>
          </suspense>
        </transition>
      </router-view>


    </div>
  `,
})
app.use(router)
// app.component('RouterView', RouterViewSuspended)

window.vm = app.mount('#app')
window.r = router
