import { createRouter, createWebHistory } from './index'
import { createApp } from 'vue'

const router = createRouter({
  history: createWebHistory(),
  strict: true,
  routes: [],
  parseQuery: search => ({}),
  stringifyQuery: query => '',
  end: true,
  sensitive: true,
  scrollBehavior(to, from, savedPosition) {},
})

const app = createApp({})
app.use(router)
