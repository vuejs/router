import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { router } from './router/resolver'
import { DataLoaderPlugin } from 'vue-router/experimental'
import { RouterLink, RouterView } from 'vue-router'

const app = createApp(App)

app.use(createPinia())
app.use(PiniaColada, {})
app.use(DataLoaderPlugin, {
  // FIXME: should be doable without `as any`
  router: router as any,
})
app.component('RouterLink', RouterLink)
app.component('RouterView', RouterView)
app.use(router)

// @ts-expect-error: for debugging on browser
window.$router = router

app.mount('#app')

// small logger for navigations, useful to check HMR
router.isReady().then(() => {
  router.beforeEach((to, from) => {
    console.log('🧭', from.fullPath, '->', to.fullPath)
  })
})
