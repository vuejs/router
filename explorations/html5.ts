import { Router, HTML5History } from '../src'
import { RouteComponent } from '../src/types'

declare global {
  interface Window {
    cancel: boolean
  }
}
window.cancel = false

const component: RouteComponent = {
  template: `<div>A component</div>`,
}

const GuardedWithLeave: RouteComponent = {
  template: `<div>
    <p>try to leave</p>
  </div>`,
  beforeRouteLeave(to, from, next) {
    if (window.confirm()) next()
    else next(false)
  },
}

const r = new Router({
  history: new HTML5History(),
  routes: [
    { path: '/', component },
    { path: '/users/:id', name: 'user', component },
    { path: '/n/:n', name: 'increment', component },
    { path: '/multiple/:a/:b', name: 'user', component },
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
    // { path: /^\/about\/?$/, component },
  ],
})

r.beforeEach((to, from, next) => {
  console.log(`Guard from ${from.fullPath} to ${to.fullPath}`)
  if (to.params.id === 'no-name') return next(false)
  next()
})

r.beforeEach((to, from, next) => {
  if (window.cancel) return next(false)
  next()
})

r.afterEach((to, from) => {
  console.log(
    `After guard: from ${from.fullPath} to ${
      to.fullPath
    } | location = ${location.href.replace(location.origin, '')}`
  )
})

r.beforeEach((to, from, next) => {
  console.log('second guard')
  next()
})

// const h = new HTML5History()
// @ts-ignore
const h = r.history
// @ts-ignore
window.h = h
// @ts-ignore
window.r = r

h.listen((to, from, { type }) => {
  console.log(`popstate(${type})`, { to, from })
})

async function run() {
  // r.push('/multiple/one/two')

  // h.push('/hey')
  // h.push('/hey?lol')
  // h.push('/foo')
  // h.push('/replace-me')
  // h.replace('/bar')

  // r.push('/about')
  await r.push({
    path: '/',
  })

  await r.push({
    name: 'user',
    params: {
      id: '6',
    },
  })

  await r.push({
    name: 'user',
    params: {
      id: '5',
    },
  })

  try {
    await r.push({
      params: {
        id: 'no-name',
      },
    })
  } catch (err) {
    console.log('Navigation aborted', err)
  }

  await r.push({
    hash: '#hey',
  })

  await r.push('/children')
  await r.push('/children/a')
  await r.push('/children/b')
  await r.push({ name: 'a-child' })
}

run()
