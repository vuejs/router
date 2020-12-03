import { createRouter, createWebHistory, useRoute } from '../../src'
import { RouteLocationNormalizedLoaded } from '../../src/types'
import {
  createApp,
  readonly,
  ref,
  watchEffect,
  computed,
  toRefs,
  defineComponent,
} from 'vue'

const users = readonly([
  { name: 'John' },
  { name: 'Jessica' },
  { name: 'James' },
])

const historyState = ref(history.state || {})

async function showUserModal(id: number) {
  // add backgroundView state to the location so we can render a different view from the one
  const backgroundView = router.currentRoute.value.fullPath

  await router.push({
    name: 'user',
    params: { id },
    // state: { backgroundView },
  })

  history.replaceState({ ...history.state, backgroundView }, '')
  historyState.value = history.state
}

function closeUserModal() {
  history.back()
}

const Home = defineComponent({
  template: `<div>
  <h1>Home</h1>
  <p>Select a user</p>
  <ul>
    <li v-for="(user, id) in users">
      <router-link :to="{ name: 'user', params: { id }}">{{ user.name }}</router-link>
      - <button @click="showUserModal(id)">Details</button>
    </li>
  </ul>

  <router-view />

  <dialog ref="modal" id="dialog">
    <div>
      <div v-if="userId">
        <p>
        User #{{ userId }}
        <br>
        Name: {{ users[userId].name }}
        </p>
        <router-link to="/about">Go somewhere else</router-link>
        <br>
        <button @click="closeUserModal">Close</button>
      </div>
    </div>
  </dialog>
  </div>`,
  setup() {
    const modal = ref<HTMLDialogElement | HTMLElement>()
    const route = useRoute()
    // const historyState = computed(() => route.fullPath && window.history.state)

    const userId = computed(() => route.params.id)

    watchEffect(
      () => {
        const el = modal.value
        if (!el) return

        const show = historyState.value.backgroundView
        console.log('show modal?', show)
        if (show) {
          if ('show' in el) el.show()
          else el.setAttribute('open', '')
        } else {
          if ('close' in el) el.close()
          else el.removeAttribute('open')
        }
      },
      { flush: 'post' }
    )

    return {
      modal,
      historyState,
      showUserModal,
      closeUserModal,
      userId,
      users,
    }
  },
})

const About = defineComponent({
  template: `<div>
    <h1>About</h1>
    <button @click="back">Back</button>
    <span> | </span>
    <router-link to="/">Back home</router-link>
  </div>`,
  methods: {
    back: () => history.back(),
  },
})

const Child = defineComponent({
  template: `<div class="child">child</div>`,
})

const UserDetails = defineComponent({
  template: `<div>
    <h1>User #{{ id }}</h1>
    <p>
      Name: {{ users[id].name }}
    </p>
    <router-link to="/">Back home</router-link>
  </div>`,
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data: () => ({ users }),
})

const webHistory = createWebHistory('/' + __dirname)
const router = createRouter({
  history: webHistory,
  routes: [
    {
      path: '/',
      component: Home,
      children: [
        // to check that displaying the modal doesn't change this
        { path: '', component: Child },
      ],
    },
    { path: '/about', component: About },
    { path: '/users/:id', props: true, name: 'user', component: UserDetails },
  ],
})

router.afterEach(() => {
  historyState.value = history.state
})

router.beforeEach((to, from, next) => {
  console.log('---')
  console.log('going from', from.fullPath, 'to', to.fullPath)
  console.log('state:', window.history.state)
  console.log('---')
  next()
})

const app = createApp({
  setup() {
    const route = useRoute()
    // const historyState = computed(() => route.fullPath && window.history.state)
    const routeWithModal = computed(() => {
      if (historyState.value.backgroundView) {
        return router.resolve(
          historyState.value.backgroundView
        ) as RouteLocationNormalizedLoaded
      } else {
        return route
      }
    })

    return { route, routeWithModal, historyState, ...toRefs(route) }
  },

  template: `
    <div id="app">
      <router-view :route="routeWithModal"></router-view>
    </div>
  `,
})
app.use(router)

window.vm = app.mount('#app')
