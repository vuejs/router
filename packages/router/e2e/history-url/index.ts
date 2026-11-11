import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'

const router = createRouter({
  // no base: `/\evil.com` is only read as another host at the start of the url
  history: createWebHistory(),
  routes: [
    {
      // `[^]` also matches newlines
      path: '/:any([^]*)',
      component: { template: '<div>any</div>' },
    },
  ],
})

const app = createApp({
  template: `
    <pre id="fullPath">{{ $route.fullPath }}</pre>
    <router-view />
  `,
})
app.use(router)

window.r = router
window.vm = app.mount('#app')
