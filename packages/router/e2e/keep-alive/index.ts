import '../global.css'
import {
  RouteComponent,
  createRouter,
  createWebHistory,
  useRouter,
} from 'vue-router'
import { createApp, ref } from 'vue'

const Home: RouteComponent = {
  template: `
    <div class="home">
      <h2>Home</h2>
      <p>Counter: <span id="counter">{{ n }}</span></p>
      <button @click="n++" id="increment">Increment</button>
    </div>
  `,
  setup() {
    return {
      n: ref(0),
    }
  },
}

const Foo: RouteComponent = { template: '<div class="foo">foo</div>' }

const WithGuards: RouteComponent = {
  template: `<div>
    <p>Enter Count <span id="enter-count">{{ enterCount }}</span></p>
    <p>Update Count <span id="update-count">{{ updateCount }}</span></p>
    <p>Leave Count <span id="leave-count">{{ leaveCount }}</span></p>
    <button id="change-query" @click="changeQuery">Change query</button>
    <button id="reset" @click="reset">Reset</button>
    </div>`,

  beforeRouteEnter(to, from, next) {
    next(vm => {
      ;(vm as any).enterCount++
    })
  },

  beforeRouteUpdate(to, from, next) {
    this.updateCount++
    next()
  },
  beforeRouteLeave(to, from, next) {
    this.leaveCount++
    next()
  },

  setup() {
    const enterCount = ref(0)
    const updateCount = ref(0)
    const leaveCount = ref(0)
    const router = useRouter()

    function reset() {
      enterCount.value = 0
      updateCount.value = 0
      leaveCount.value = 0
    }

    function changeQuery() {
      router.push({ query: { q: Date.now() } })
    }
    return {
      reset,
      changeQuery,
      enterCount,
      updateCount,
      leaveCount,
    }
  },
}

const webHistory = createWebHistory('/keep-alive')
const router = createRouter({
  history: webHistory,
  routes: [
    { path: '/', component: Home },
    { path: '/with-guards', component: WithGuards },
    {
      path: '/foo',
      component: Foo,
    },
  ],
})
const app = createApp({
  template: `
    <h1>KeepAlive</h1>
    <ul>
      <li><router-link to="/">/</router-link></li>
      <li><router-link to="/foo">/foo</router-link></li>
      <li><router-link to="/with-guards">/with-guards</router-link></li>
    </ul>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component class="view" :is="Component" />
      </keep-alive>
    </router-view>
  `,
})
app.use(router)

app.mount('#app')
