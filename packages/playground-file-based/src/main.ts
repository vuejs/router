import { createVaporApp, vaporInteropPlugin } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { router } from './router/resolver'
import { DataLoaderPlugin } from 'vue-router/experimental'
import {
  RouterLink as VaporRouterLink,
  RouterView as VaporRouterView,
} from 'vue-router/experimental/vapor'

const app = createVaporApp(App)
app.use(vaporInteropPlugin)

app.use(createPinia())
app.use(PiniaColada, {})
app.use(DataLoaderPlugin, {
  router,
})
app.component('RouterLink', VaporRouterLink)
app.component('RouterView', VaporRouterView)
router.afterEach((to, from, failure) => {
  if (failure) {
    console.info('⛔️ Failed navigation', from.fullPath, '->', to.fullPath)
    console.warn(failure)
  }
})
router.onError(err => {
  console.log('❌ Router error', err)
})
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

declare module 'vue-router' {
  export interface TypesConfig {
    Router: typeof router
  }
}
