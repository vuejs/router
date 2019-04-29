import { Router, HTML5History } from '../src'

const component = null

const r = new Router({
  history: new HTML5History(),
  routes: [
    { path: '/', component },
    { path: '/users/:id', name: 'user', component },
    { path: '/multiple/:a/:b', name: 'user', component },
    // { path: /^\/about\/?$/, component },
  ],
})

r.beforeEach((to, from, next) => {
  console.log(`Guard from ${from.fullPath} to ${to.fullPath}`)
  if (to.params.id === 'no-name') return next(false)
  next()
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
}

run()
