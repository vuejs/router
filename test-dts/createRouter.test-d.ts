import {
  createRouter,
  createWebHistory,
  NavigationGuard,
  NavigationGuardNext,
  RouteLocationNormalized,
} from './index'
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

export const loggedInGuard: NavigationGuard = (to, from, next) => next('/')
function beforeGuardFn(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {}

router.beforeEach(loggedInGuard)
router.beforeEach(beforeGuardFn)

const app = createApp({})
app.use(router)
