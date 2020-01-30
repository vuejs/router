import { createApp } from 'vue'
import { router, routerHistory } from './router'
import { globalState } from './store'
import { RouterPlugin } from '../src'
import App from './App.vue'

declare global {
  interface Window {
    // h: HTML5History
    h: typeof routerHistory
    r: typeof router
  }
}

// for testing purposes
window.h = routerHistory
window.r = router

const app = createApp(App)
app.provide('state', globalState)
app.use(RouterPlugin, router)

app.mount('#app')
