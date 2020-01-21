import {
  createRouter,
  RouterPlugin,
  // @ts-ignore
  createHistory,
  // @ts-ignore
  createMemoryHistory,
  // @ts-ignore
  createHashHistory,
  RouteLocationNormalized,
} from '../src'
import {
  defineComponent,
  computed,
  createApp,
  inject,
  reactive,
  Ref,
} from 'vue'

declare global {
  interface Window {
    // h: HTML5History
    h: ReturnType<typeof createHistory>
    r: ReturnType<typeof createRouter>
  }
}

// const routerHistory = createHistory('/app')
// const routerHistory = createHashHistory()
const routerHistory = createHistory()
window.h = routerHistory

const component = defineComponent({
  name: 'GenericComponent',
  template: `<div>A component</div>`,
})

const NotFound = defineComponent({
  name: 'NotFound',
  setup() {
    const route = inject('route')
    return { route }
  },
  template: `<div>Not Found: {{ route.fullPath }}</div>`,
})

const Home = defineComponent({
  name: 'Home',
  template: `<div>Home</div>`,
})

const User = defineComponent({
  name: 'User',
  setup() {
    const route = inject('route')
    console.log({ route })
    return { route }
  },
  template: `<div>User: {{ route.params.id }}</div>`,
})

const LongView = defineComponent({
  name: 'LongView',
  setup() {
    const route = inject('route')
    return { route }
  },
  template: `
  <section>
    <div class="long">This one is long: {{ route.params.n }}. Go down to click on a link</div>
    <p class="long">
      <router-link
        :to="{ name: 'long', params: { n: Number(route.params.n || 0) + 1 }}"
        >/long-{{ Number(route.params.n || 0) + 1 }}</router-link>
    </p>
  </section>
  `,
})

const GuardedWithLeave = defineComponent({
  name: 'GuardedWithLeave',
  template: `<div>
    <p>try to leave</p>
  </div>`,
  // @ts-ignore
  beforeRouteLeave(to, from, next) {
    if (window.confirm()) next()
    else next(false)
  },
})

const ComponentWithData = defineComponent({
  name: 'ComponentWithData',
  template: `<div>
    <p>Here is the data: {{ data }}</p>
  </div>`,
  data: () => ({ data: 'nope' }),
  // @ts-ignore
  beforeRouteEnter(to, from, next) {
    // console.log('this in beforeRouteEnter', this)
    // setTimeout(() => {
    // next(vm => {
    //   // console.log('got vm', vm)
    //   vm.data = 'Hola'
    // })
    // }, 300)
  },
})

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

class ScrollQueue {
  private resolve: (() => void) | null = null
  private promise: Promise<any> | null = null

  add() {
    this.promise = new Promise(resolve => {
      this.resolve = resolve
    })
  }

  flush() {
    this.resolve && this.resolve()
    this.resolve = null
    this.promise = null
  }

  async wait() {
    await this.promise
  }
}

const scrollWaiter = new ScrollQueue()

// const hist = new HTML5History()
// const hist = new HashHistory()
const router = createRouter({
  history: routerHistory,
  routes: [
    { path: '/', component: Home, name: 'home', alias: '/home' },
    { path: '/users/:id', name: 'user', component: User },
    { path: '/documents/:id', name: 'docs', component: User },
    { path: encodeURI('/n/€'), name: 'euro', component },
    { path: '/n/:n', name: 'increment', component },
    { path: '/multiple/:a/:b', name: 'multiple', component },
    { path: '/long-:n', name: 'long', component: LongView },
    {
      path: '/with-guard/:n',
      name: 'guarded',
      component,
      beforeEnter(to, from, next) {
        if (to.params.n !== 'valid') next(false)
        next()
      },
    },
    { path: '/cant-leave', component: GuardedWithLeave },
    {
      path: '/children',
      component,
      children: [
        { path: '', name: 'default-child', component },
        { path: 'a', name: 'a-child', component },
        { path: 'b', name: 'b-child', component },
      ],
    },
    { path: '/with-data', component: ComponentWithData, name: 'WithData' },
    { path: '/rep/:a*', component: component, name: 'repeat' },
    { path: '/:data(.*)', component: NotFound, name: 'NotFound' },
  ],
  async scrollBehavior(to, from, savedPosition) {
    await scrollWaiter.wait()
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  },
})

// for testing purposes
window.r = router

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t))

router.beforeEach(async (to, from, next) => {
  // console.log(`Guard from ${from.fullPath} to ${to.fullPath}`)
  if (to.params.id === 'no-name') return next(false)

  const time = Number(to.query.delay)
  if (time > 0) {
    console.log('⏳ waiting ' + time + 'ms')
    await delay(time)
  }
  next()
})

router.beforeEach((to, from, next) => {
  if (globalState.cancelNextNavigation) return next(false)
  next()
})

router.afterEach((to, from) => {
  // console.log(
  //   `After guard: from ${from.fullPath} to ${
  //     to.fullPath
  //   } | location = ${location.href.replace(location.origin, '')}`
  // )
})

router.beforeEach((to, from, next) => {
  // console.log('second guard')
  if (to.query.to) next(to.query.to as string)
  else next()
})

const dirLog = {
  '': '？',
  back: '⏪',
  forward: '⏩',
}
routerHistory.listen((to, from, info) => {
  console.log(`${dirLog[info.direction]} as a ${info.type}`)
})

async function run() {
  // router.push('/multiple/one/two')
  // h.push('/hey')
  // h.push('/hey?lol')
  // h.push('/foo')
  // h.push('/replace-me')
  // h.replace('/bar')
  // router.push('/about')
  // await router.push('/')
  // await router.push({
  //   name: 'user',
  //   params: {
  //     id: '6',
  //   },
  // })
  // await router.push({
  //   name: 'user',
  //   params: {
  //     id: '5',
  //   },
  // })
  // try {
  //   await router.push({
  //     params: {
  //       id: 'no-name',
  //     },
  //   })
  // } catch (err) {
  //   console.log('Navigation aborted', err)
  // }
  // await router.push({
  //   hash: '#hey',
  // })
  // await router.push('/children')
  // await router.push('/children/a')
  // await router.push('/children/b')
  // await router.push({ name: 'a-child' })
}

const globalState = reactive({
  cancelNextNavigation: false,
})

const App = defineComponent({
  name: 'App',
  setup() {
    // TODO: should be a computed property or a readonly ref
    const route = inject<Ref<RouteLocationNormalized>>('route')!
    const state = inject<typeof globalState>('state')!
    const currentLocation = computed(() => {
      const { matched, ...rest } = route.value
      return rest
    })

    function flushWaiter() {
      scrollWaiter.flush()
    }
    function setupWaiter() {
      scrollWaiter.add()
    }

    const nextUserLink = computed(
      () =>
        '/users/' +
        String((Number(router.currentRoute.value.params.id) || 0) + 1)
    )

    return { currentLocation, nextUserLink, state, flushWaiter, setupWaiter }
  },
  template: document.getElementById('app')?.innerHTML,
})

const app = createApp()
app.provide('state', globalState)
app.use(RouterPlugin, router)

app.mount(App, '#app')

// use the router
// Vue.use(plugin)

// window.vm = new Vue({
// el: '#app',
// @ts-ignore
// router,
// data: {
//   message: 'hello',
//   shared,
// },

// methods: {

// try out watchers
// watch: {
//   'route.params.id' (id) {
//     console.log('id changed', id)
//   },
//   'route.name' (name) {
//     console.log('name changed', name)
//   }
// }
// })

run()
