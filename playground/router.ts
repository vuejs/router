import { createRouter, createWebHistory } from '../src'
import Home from './views/Home.vue'
import Nested from './views/Nested.vue'
import NestedWithId from './views/NestedWithId.vue'
import Dynamic from './views/Dynamic.vue'
import User from './views/User.vue'
import NotFound from './views/NotFound.vue'
import component from './views/Generic.vue'
import LongView from './views/LongView.vue'
import GuardedWithLeave from './views/GuardedWithLeave.vue'
import ComponentWithData from './views/ComponentWithData.vue'
import { globalState } from './store'
import { scrollWaiter } from './scrollWaiter'
let removeRoute: (() => void) | undefined

// const hist = new HTML5History()
// const hist = new HashHistory()
export const routerHistory = createWebHistory()
export const router = createRouter({
  history: routerHistory,
  routes: [
    { path: '/home', redirect: '/' },
    { path: '/', component: Home },
    {
      path: '/always-redirect',
      redirect: () => ({
        name: 'user',
        params: { id: String(Math.round(Math.random() * 100)) },
      }),
    },
    { path: '/users/:id', name: 'user', component: User, props: true },
    { path: '/documents/:id', name: 'docs', component: User, props: true },
    { path: encodeURI('/n/€'), name: 'euro', component },
    { path: '/n/:n', name: 'increment', component },
    { path: '/multiple/:a/:b', name: 'multiple', component },
    { path: '/long-:n', name: 'long', component: LongView },
    {
      path: '/lazy',
      component: async () => {
        await delay(500)
        return component
      },
    },
    {
      path: '/with-guard/:n',
      name: 'guarded',
      component,
      beforeEnter(to, from, next) {
        if (to.params.n !== 'valid') next(false)
        next()
      },
    },
    { path: '/cant-leave', component: GuardedWithLeave },
    {
      path: '/children',
      component,
      children: [
        { path: '', name: 'default-child', component },
        { path: 'a', name: 'a-child', component },
        { path: 'b', name: 'b-child', component },
      ],
    },
    { path: '/with-data', component: ComponentWithData, name: 'WithData' },
    { path: '/rep/:a*', component: component, name: 'repeat' },
    { path: '/:data(.*)', component: NotFound, name: 'NotFound' },
    {
      path: '/nested',
      alias: '/anidado',
      component: Nested,
      name: 'Nested',
      children: [
        {
          path: 'nested',
          alias: 'a',
          name: 'NestedNested',
          component: Nested,
          children: [
            {
              name: 'NestedNestedNested',
              path: 'nested',
              component: Nested,
            },
          ],
        },
        {
          path: 'other',
          alias: 'otherAlias',
          component: Nested,
          name: 'NestedOther',
        },
        {
          path: 'also-as-absolute',
          alias: '/absolute',
          name: 'absolute-child',
          component: Nested,
        },
      ],
    },

    {
      path: '/parent/:id',
      name: 'parent',
      component: NestedWithId,
      props: true,
      alias: '/p/:id',
      children: [
        // empty child
        { path: '', component },
        // child with absolute path. we need to add an `id` because the parent needs it
        { path: '/p_:id/absolute-a', alias: 'as-absolute-a', component },
        // same as above but the alias is absolute
        { path: 'as-absolute-b', alias: '/p_:id/absolute-b', component },
      ],
    },
    {
      path: '/dynamic',
      name: 'dynamic',
      component: Nested,
      options: { end: false, strict: true },
      beforeEnter(to, from, next) {
        if (!removeRoute) {
          removeRoute = router.addRoute('dynamic', {
            path: 'child',
            component: Dynamic,
          })
          next(to.fullPath)
        } else next()
      },
    },
  ],
  async scrollBehavior(to, from, savedPosition) {
    await scrollWaiter.wait()
    if (savedPosition) {
      return savedPosition
    } else {
      // TODO: check if parent in common that works with alias
      if (to.matched.every((record, i) => from.matched[i] !== record))
        return { x: 0, y: 0 }
    }
    // leave scroll as it is by not returning anything
    // https://github.com/Microsoft/TypeScript/issues/18319
    return false
  },
})

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t))

router.beforeEach(async (to, from, next) => {
  // console.log(`Guard from ${from.fullPath} to ${to.fullPath}`)
  if (to.params.id === 'no-name') return next(false)

  const time = Number(to.query.delay)
  if (time > 0) {
    console.log('⏳ waiting ' + time + 'ms')
    await delay(time)
  }
  next()
})

router.beforeEach((to, from, next) => {
  if (globalState.cancelNextNavigation) return next(false)
  next()
})

router.afterEach((to, from) => {
  // console.log(
  //   `After guard: from ${from.fullPath} to ${
  //     to.fullPath
  //   } | location = ${location.href.replace(location.origin, '')}`
  // )
})

router.beforeEach((to, from, next) => {
  // console.log('second guard')
  if (to.query.to) next(to.query.to as string)
  else next()
})

const dirLog = {
  '': '？',
  back: '⏪',
  forward: '⏩',
}
routerHistory.listen((to, from, info) => {
  console.log(`${dirLog[info.direction]} as a ${info.type}`)
})
