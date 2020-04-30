import { createRouter, createWebHistory } from './index'
import { createApp, defineComponent } from 'vue'

const component = defineComponent({})

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component }],
  parseQuery: search => ({}),
  stringifyQuery: query => '',
  strict: true,
  end: true,
  sensitive: true,
  scrollBehavior(to, from, savedPosition) {},
})

const app = createApp({})
app.use(router)
