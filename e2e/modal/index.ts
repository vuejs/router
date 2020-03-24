import { createRouter, createWebHistory, useRoute } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp, readonly, reactive, ref, watchEffect } from 'vue'

const users = readonly([
  { name: 'John' },
  { name: 'Jessica' },
  { name: 'James' },
])

const modalState = reactive({
  showModal: false,
  userId: 0,
})

const enum GhostNavigation {
  none = 0,
  restoreGhostUrl,
  backToOriginal,
}

let navigationState: GhostNavigation = GhostNavigation.none
window.addEventListener('popstate', function customPopListener(event) {
  let { state } = event
  console.log('popstate!', navigationState, event.state)

  // nested state machine to handle
  if (navigationState !== GhostNavigation.none) {
    if (navigationState === GhostNavigation.restoreGhostUrl) {
      webHistory.replace(state.ghostURL)
      console.log('replaced ghost', state.ghostURL)
      navigationState = GhostNavigation.backToOriginal
      webHistory.back(false)
    } else if (navigationState === GhostNavigation.backToOriginal) {
      navigationState = GhostNavigation.none
      Object.assign(modalState, state.modalState)
      console.log('came from a ghost navigation, nothing to do')
      // let's remove the guard from navigating away, it will be added again by afterEach when
      // entering the url
      historyCleaner && historyCleaner()
      historyCleaner = undefined
      event.stopImmediatePropagation()
    }

    return
  }

  if (!state) return
  // we did a back from a modal
  if (state.forwardGhost && webHistory.state.ghostURL === state.forwardGhost) {
    // make sure the url saved in the history stack is good
    navigationState = GhostNavigation.restoreGhostUrl
    cleanNavigationFromModalListener && cleanNavigationFromModalListener()
    webHistory.forward(false)
    // we did a forward to a modal
  } else if (
    state.ghostURL &&
    state.ghostURL === webHistory.state.forwardGhost
  ) {
    webHistory.replace(state.displayURL)
    event.stopImmediatePropagation()
    Object.assign(modalState, state.modalState)
    // TODO: setup same listeners as state S
    // we did a back to a modal
  } else if (
    state.ghostURL &&
    state.ghostURL === webHistory.state.backwardGhost
  ) {
    let remove = router.afterEach(() => {
      Object.assign(modalState, state.modalState)
      remove()
      removeError()
    })
    // if the navigation fails, remove the listeners
    let removeError = router.onError(() => {
      console.log('navigation aborted, removing stuff')
      remove()
      removeError()
    })
  }
  // if ((state && !state.forward) || state.showModal) {
  //   console.log('stopping it!')
  //   // copy showModal state
  //   modalState.showModal = !!state.showModal
  //   // don't let the router catch this one
  //   event.stopImmediatePropagation()
  // }
})

const About: RouteComponent = {
  template: `<div>
  <h1>About</h1>
  <p>If you came from a user modal, you should go back to it</p>
  <button @click="back">Back</button>
  </div>
  `,
  methods: {
    back() {
      window.history.back()
    },
  },
}

let historyCleaner: (() => void) | undefined

let cleanNavigationFromModalListener: (() => void) | undefined

function setupPostNavigationFromModal(ghostURL: string) {
  let removePost: (() => void) | undefined
  const removeGuard = router.beforeEach((to, from, next) => {
    console.log('From', from.fullPath, '->', to.fullPath)
    // change the URL before leaving so that when we go back we are navigating to the right url
    webHistory.replace(ghostURL)
    console.log('changed url', ghostURL)
    removeGuard()
    removePost = router.afterEach(() => {
      console.log('✅ navigated away')
      webHistory.replace(webHistory.location, {
        backwardGhost: ghostURL,
      })
      removePost && removePost()
    })

    // trigger the navigation again, TODO: does it change anything
    next(to.fullPath)
  })

  // remove any existing listener
  cleanNavigationFromModalListener && cleanNavigationFromModalListener()

  cleanNavigationFromModalListener = () => {
    removeGuard()
    removePost && removePost()
    cleanNavigationFromModalListener = undefined
  }
}

function showUserModal(id: number) {
  const route = router.currentRoute.value
  // generate a new entry that is exactly like the one we are on but with an extra query
  // so it still counts like a navigation for the router when leaving it or when pushing on top
  const ghostURLNormalized = router.resolve({
    path: route.path,
    query: { ...route.query, __m: Math.random() },
    hash: route.hash,
  })
  // the url we want to show
  let url = router.resolve({ name: 'user', params: { id: '' + id } })
  const displayURL = url.fullPath
  const ghostURL = ghostURLNormalized.fullPath
  const originalURL = router.currentRoute.value.fullPath

  webHistory.replace(router.currentRoute.value, {
    // save that we are going to a ghost route
    forwardGhost: ghostURL,
    // save current modalState to be able to restore it when navigating away
    // from the modal
    modalState: { ...modalState },
  })

  // after saving the modal state, we can change it
  modalState.userId = id
  modalState.showModal = true

  // push a new entry in the history stack with the ghost url in the state
  // to be able to restore it
  webHistory.push(displayURL, {
    // the url that should be displayed while being on this entry
    displayURL,
    // the original url TODO: is it necessary?
    originalURL,
    // the url that resolves to the same components as originalURL but slightly different
    // so that the router doesn't consider it as a duplicated navigation
    ghostURL,
    modalState: { ...modalState },
  })

  // make sure we clear what we did before leaving
  // this will only trigger on `push`/`replace` because we are listening on `popstate`
  // so that if we go to the previous entry we can stop the propagation so the router never knows
  // and remove this listener ourselves
  setupPostNavigationFromModal(ghostURL)
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
    <p>
    User #{{ modalState.userId }}
    <br>
    Name: {{ users[modalState.userId].name }}
    </p>
    <router-link to="/about">Go somewhere else</router-link>
    <br>
    <button @click="closeUserModal">Close</button>
  </dialog>
  </div>`,
  setup() {
    const modal = ref()

    watchEffect(() => {
      if (!modal.value) return

      const show = modalState.showModal
      console.log('show modal?', show)
      if (show) modal.value.show()
      else modal.value.close()
    })

    return {
      modal,
      showUserModal,
      closeUserModal,
      modalState,
      users,
    }
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

router.afterEach(() => {
  const { state } = window.history
  console.log('afterEach', state)
  if (state && state.displayURL) {
    console.log('restoring', state.displayURL, 'for', state.originalURL)
    // restore the state
    Object.assign(modalState, state.modalState)
    webHistory.replace(state.displayURL)
    // history.pushState({ showModal: true }, '', url)
    // historyCleaner && historyCleaner()
    historyCleaner = router.beforeEach((to, from, next) => {
      // add data to history state so it can be restored if we go back
      webHistory.replace(state.ghostURL, {
        modalState: { ...modalState },
      })
      // remove this guard
      historyCleaner && historyCleaner()
      // trigger the same navigation again
      next(to.fullPath)
    })
  }
})

const app = createApp({
  setup() {
    const route = useRoute()
    return { route }
  },
})
app.use(router)

window.vm = app.mount('#app')
