import type { RouteComponent } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { createApp, defineComponent } from 'vue'
import {
  ScrollRestoration,
  useScrollRestoration,
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
} from 'vue-router/experimental'

function createAutomaticPage(name: string): RouteComponent {
  return defineComponent({
    setup() {
      useScrollRestoration({ key: 'automatic' })
    },
    template: `<main class="view ${name}"><h2>${name}</h2></main>`,
  })
}

const AutomaticA = createAutomaticPage('automatic-a')
const AutomaticB = createAutomaticPage('automatic-b')
const Anchors = defineComponent({
  setup() {
    useScrollRestoration()
  },
  template: `
    <main class="view anchors">
      <h2>anchors</h2>
      <a id="native-anchor" href="#target">native #target</a>
      <router-link id="router-link-anchor" to="#target">router-link #target</router-link>
      <div style="height:2000px"></div>
      <p id="target">target</p>
    </main>
  `,
})
const Other = defineComponent({
  setup() {
    useScrollRestoration()
  },
  template: `<main class="view other"><h2>other</h2></main>`,
})
const Neutral: RouteComponent = {
  template: '<main class="view neutral"><h2>neutral</h2></main>',
}

const router = createRouter({
  history: createWebHistory('/scroll-restoration/'),
  routes: [
    { path: '/', redirect: '/automatic-a' },
    { path: '/automatic-a', component: AutomaticA },
    { path: '/automatic-b', component: AutomaticB },
    { path: '/anchors', component: Anchors },
    { path: '/other', component: Other },
    { path: '/neutral', component: Neutral },
  ],
})

// keeps navigations pending for a few frames
router.beforeEach(async to => {
  if (to.query.slow != null) await new Promise(r => setTimeout(r, 200))
})

const app = createApp({
  template: `
    <h1>Scroll Restoration</h1>
    <nav>
      <router-link to="/automatic-a">automatic-a</router-link>
      <router-link to="/automatic-b">automatic-b</router-link>
      <router-link to="/neutral">neutral</router-link>
      <router-link to="/other">other</router-link>
      <router-link to="/anchors">anchors</router-link>
    </nav>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  `,
})

app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
})
app.use(router)

router.isReady().then(() => (window.vm = app.mount('#app')))
