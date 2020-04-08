import { createRouter, useRoute, createWebHashHistory } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp } from 'vue'

const Home: RouteComponent = {
  template: `<div>home</div>`,
}

const Foo: RouteComponent = { template: '<div>foo</div>' }
const Bar: RouteComponent = { template: '<div>bar</div>' }

const Unicode: RouteComponent = {
  setup() {
    const route = useRoute()
    return { route }
  },
  template: `<div>param: <span id="param">{{ route.params.id }}</span></div>`,
}

const router = createRouter({
  history: createWebHashHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home },
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar },
    { path: '/unicode/:id', name: 'unicode', component: Unicode },
    { path: encodeURI('/n/é'), name: 'encoded', component: Foo },
  ],
})

const app = createApp({
  setup() {
    const route = useRoute()
    return { route }
  },
})
app.use(router)

window.r = router
window.vm = app.mount('#app')
