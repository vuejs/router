import { createRouter, useRoute, createWebHashHistory } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp } from 'vue'

const component: RouteComponent = {
  template: `<div>A component</div>`,
}

const Home: RouteComponent = {
  template: `<div>Home</div>`,
}

const Document: RouteComponent = {
  setup() {
    const route = useRoute()
    return { route }
  },
  template: `<div>Document: {{ route.params.id }}</div>`,
}

const router = createRouter({
  history: createWebHashHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home, name: 'home' },
    { path: '/documents/:id', name: 'docs', component: Document },
    { path: encodeURI('/n/€'), name: 'euro', component },
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
