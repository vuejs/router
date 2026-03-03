import {
  createWebHistory,
  useRoute,
  useRouter,
  type RouteLocationMatched,
  type RouteLocationNormalizedGeneric,
} from 'vue-router'
import { experimental_createRouter as createRouter } from 'vue-router/experimental'
import { resolver, handleHotUpdate } from 'vue-router/auto-resolver'

export const router = createRouter({
  history: createWebHistory(),
  resolver,
})

if (import.meta.hot) {
  handleHotUpdate(router)
}

export function __internalTest() {
  definePage({
    name: 'hey',
  })
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

  const a = {} as RouteLocationNormalizedGeneric
  const b = {} as RouteLocationMatched

  // createFixedResolver([])
  a.matched[0]?.children.length
  b.children?.length
}
