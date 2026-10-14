import { createWebHistory } from 'vue-router'
import { experimental_createRouter } from 'vue-router/experimental'
import { resolver } from 'vue-router/auto-resolver'

export const router = experimental_createRouter({
  history: createWebHistory(),
  resolver,
})

declare module 'vue-router' {
  interface TypesConfig {
    Router: typeof router
  }
}
