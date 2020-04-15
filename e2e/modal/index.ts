import { createRouter, createWebHistory, useRoute, useView } from '../../src'
import { RouteComponent, RouteLocationNormalizedLoaded } from '../../src/types'
import { createApp, readonly, ref, watchEffect, computed, toRefs } from 'vue'

const users = readonly([
  { name: 'John' },
  { name: 'Jessica' },
  { name: 'James' },
])

async function showUserModal(id: number) {
  // add backgroundView state to the location so we can render a different view from the one
  const backgroundView = router.currentRoute.value.fullPath

  await router.push({
    name: 'user',
    params: { id: '' + id },
    state: { backgroundView },
  })
}

function closeUserModal() {
  history.back()
}

const Home: RouteComponent = {
  template: `<div>
  <h1>Home</h1>
  <p>Select a user</p>
  <ul>
    <li v-for="(user, id) in users">
      <router-link :to="{ name: 'user', params: { id }}">{{ user.name }}</router-link>
      - <button @click="showUserModal(id)">Details</button>
    </li>
  </ul>

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
    const historyState = computed(() => route.fullPath && window.history.state)

    const userId = computed(() => route.params.id)

    watchEffect(() => {
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
    })

    return {
      modal,
      historyState,
      showUserModal,
      closeUserModal,
      userId,
      users,
    }
  },
}

const About: RouteComponent = {
  template: `<div>
    <h1>About</h1>
    <button @click="back">Back</button>
    <span> | </span>
    <router-link to="/">Back home</router-link>
  </div>`,
  methods: {
    back: () => history.back(),
  },
}

const UserDetails: RouteComponent = {
  template: `<div>
    <h1>User #{{ id }}</h1>
    <p>
      Name: {{ users[id].name }}
    </p>
    <router-link to="/">Back home</router-link>
  </div>`,
  props: ['id'],
  data: () => ({ users }),
}

const webHistory = createWebHistory('/' + __dirname)
const router = createRouter({
  history: webHistory,
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/users/:id', props: true, name: 'user', component: UserDetails },
  ],
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
    const routeWithModal = computed(() => {
      if (historyState.value.backgroundView) {
        return router.resolve(
          historyState.value.backgroundView
        ) as RouteLocationNormalizedLoaded
      } else {
        return route
      }
    })
    const historyState = computed(() => route.fullPath && window.history.state)
    const ViewComponent = useView({ route: routeWithModal, name: 'default' })

    return { route, ViewComponent, historyState, ...toRefs(route) }
  },

  template: `
    <div id="app">
      <component :is="ViewComponent"></component>
    </div>
  `,
})
app.use(router)

window.vm = app.mount('#app')
