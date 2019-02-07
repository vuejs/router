import HTML5History from '../src/history/html5'
import { Router } from '../src'

const component = null

const r = new Router({
  history: new HTML5History(),
  routes: [
    { path: '/', component },
    { path: '/users/:id', name: 'user', component },
    { path: /^\/about\/?$/, component },
  ],
})

const h = new HTML5History()
// @ts-ignore
window.h = h
// @ts-ignore
window.r = r

h.listen((to, from) => {
  console.log({ to, from })
})

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
