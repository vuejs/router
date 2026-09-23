import type { RouteComponent } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { createApp, defineComponent } from 'vue'
import {
  ScrollRestoration,
  useScrollRestoration,
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
const Neutral: RouteComponent = {
  template: '<main class="view neutral"><h2>neutral</h2></main>',
}

const router = createRouter({
  history: createWebHistory('/scroll-restoration/'),
  routes: [
    { path: '/', redirect: '/automatic-a' },
    { path: '/automatic-a', component: AutomaticA },
    { path: '/automatic-b', component: AutomaticB },
    { path: '/neutral', component: Neutral },
  ],
})

const app = createApp({
  template: `
    <h1>Scroll Restoration</h1>
    <nav>
      <router-link to="/automatic-a">automatic-a</router-link>
      <router-link to="/automatic-b">automatic-b</router-link>
      <router-link to="/neutral">neutral</router-link>
    </nav>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  `,
})

app.use(ScrollRestoration, { router })
app.use(router)

router.isReady().then(() => (window.vm = app.mount('#app')))
