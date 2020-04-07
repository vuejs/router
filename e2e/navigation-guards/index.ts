import { createRouter, createWebHistory, useRoute } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp } from 'vue'
import GuardedWithLeave from './GuardedWithLeave'

// const component: RouteComponent = {
//   template: `<div>A component</div>`,
// }

const Home: RouteComponent = {
  template: `<div>Home</div>`,
}

// const Document: RouteComponent = {
//   template: `<div>Document: {{ route.params.id }}</div>`,
//   setup() {
//     return { route: useRoute() }
//   },
// }

const router = createRouter({
  history: createWebHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home, name: 'home' },
    { path: '/cant-leave', component: GuardedWithLeave },
  ],
})

const app = createApp({
  setup() {
    const route = useRoute()
    return { route }
  },
})
app.use(router)

window.vm = app.mount('#app')
window.r = router
