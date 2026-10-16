import { createRouter, createWebHistory, loadRouteLocation } from 'vue-router'
import { createApp, readonly, ref, computed, defineComponent } from 'vue'

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
    state: { backgroundView },
  })
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
  </div>`,

  setup() {
    return { users, showUserModal }
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

const webHistory = createWebHistory('/modal')
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
    {
      path: '/users/:id',
      props: true,
      name: 'user',
      component: UserDetails,
    },
  ],
})

router.afterEach(() => {
  historyState.value = history.state
})

router.beforeEach((to, from) => {
  console.log('---')
  console.log('going from', from.fullPath, 'to', to.fullPath)
  console.log('state:', window.history.state)
  console.log('---')
})

router.beforeResolve(async _to => {
  if (historyState.value && historyState.value.backgroundView) {
    await loadRouteLocation(router.resolve(historyState.value.backgroundView))
  }
})

// avoid navigating to non existent users
router.beforeEach(to => {
  if (to.name !== 'user') return

  const { id } = to.params
  return (
    typeof id === 'string' && !Number.isNaN(Number(id)) && !!users[Number(id)]
  )
})

const app = createApp({
  setup() {
    // the background view keeps showing the page we opened the modal from
    const backgroundRoute = computed(() =>
      historyState.value.backgroundView
        ? router.resolve(historyState.value.backgroundView)
        : undefined
    )

    return { backgroundRoute, closeUserModal }
  },

  template: `
    <router-view :route="backgroundRoute" />

    <dialog v-if="backgroundRoute" open id="dialog">
      <div>
        <router-view />
        <router-link to="/about">Go somewhere else</router-link>
        <br>
        <button @click="closeUserModal">Close</button>
      </div>
    </dialog>
  `,
})
app.use(router)

window.vm = app.mount('#app')
// @ts-expect-error
window.router = router
