import {
  createRouter,
  createWebHistory,
  NavigationGuard,
  NavigationGuardNext,
  RouteLocationNormalized,
} from './index'
import { createApp, defineComponent, h } from 'vue'

const component = defineComponent({})

const WithProps = defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
})

const Foo = defineComponent({
  props: {
    test: String,
  },
  setup() {
    return {
      title: 'homepage',
    }
  },
  render() {
    return h('div', `${this.title}: ${this.test}`)
  },
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component },
    { path: '/foo', component: Foo },
    { path: '/', component: WithProps },
  ],
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
