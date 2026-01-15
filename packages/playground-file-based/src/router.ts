import { createRouter, createWebHistory, useRoute, useRouter } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

if (import.meta.hot) {
  handleHotUpdate(router)
}

definePage({
  name: 'hey',
})

export function __internalTest() {
  const route = useRoute('/(home)')
  // @ts-expect-error: not possible
  route.name === '/about'
  route.name === '/(home)'
  const router = useRouter()
  router.push(
    // @ts-expect-error: not existing
    { name: 'nope' }
  )
  router.push({ name: '/(home)' })
}
