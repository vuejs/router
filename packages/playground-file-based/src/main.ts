import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import type {
  RouteLocationMatched,
  RouteLocationNormalizedGeneric,
} from 'vue-router'
// import { createFixedResolver } from 'vue-router/experimental'

const app = createApp(App)
app.use(router)

const a = {} as RouteLocationNormalizedGeneric
const b = {} as RouteLocationMatched

// createFixedResolver([])
a.matched[0]?.children.length
b.children?.[0]?.length

app.mount('#app')
