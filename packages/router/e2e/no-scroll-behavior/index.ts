import type { RouteComponent } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'

const Home: RouteComponent = { template: '<div class="home">home</div>' }
const Foo: RouteComponent = { template: '<div class="foo">foo</div>' }
const Bar: RouteComponent = {
  template: `
    <div class="bar">
      bar
      <div style="height:1500px"></div>
      <p id="anchor">Anchor</p>
    </div>
  `,
}

// no scrollBehavior on purpose: the router must leave the scroll position
// alone, including not reading it to save it in the history state
const router = createRouter({
  history: createWebHistory('/no-scroll-behavior'),
  routes: [
    { path: '/', component: Home },
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar },
  ],
})

const app = createApp({
  template: `
    <h1>No Scroll Behavior</h1>
    <ul>
      <li><router-link to="/">/</router-link></li>
      <li><router-link to="/foo">/foo</router-link></li>
      <li><router-link to="/bar">/bar</router-link></li>
      <li><router-link to="/bar#anchor">/bar#anchor</router-link></li>
      <li><router-link to="/bar" replace>/bar (replace)</router-link></li>
    </ul>
    <router-view class="view" />
  `,
})
app.use(router)

window.r = router
router.isReady().then(() => (window.vm = app.mount('#app')))
