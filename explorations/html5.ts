import HTML5History from '../src/history/html5'
import { Router } from '../src'

const component = null

const r = new Router({
  history: new HTML5History(),
  routes: [
    { path: '/', component },
    { path: '/users/:id', name: 'user', component },
    // { path: /^\/about\/?$/, component },
  ],
})

const h = new HTML5History()
// @ts-ignore
window.h = h
// @ts-ignore
window.r = r

h.listen((to, from) => {
  console.log('popstate', { to, from })
})

// h.push('/hey')
// h.push('/hey?lol')
// h.push('/foo')
// h.push('/replace-me')
// h.replace('/bar')

r.push('/about')
r.push({
  path: '/',
})

r.push({
  name: 'user',
  params: {
    id: '6',
  },
})

r.push({
  name: 'user',
  params: {
    id: '5',
  },
})

r.push({
  params: {
    id: 'no-name',
  },
})
