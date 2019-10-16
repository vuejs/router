import { Router, plugin, createHashHistory } from '../../src'
import { RouteComponent } from '../../src/types'
import Vue from 'vue'

const component: RouteComponent = {
  template: `<div>A component</div>`,
}

const Home: RouteComponent = {
  template: `<div>Home</div>`,
}

const Document: RouteComponent = {
  template: `<div>Document: {{ $route.params.id }}</div>`,
}

const router = new Router({
  history: createHashHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home, name: 'home' },
    { path: '/documents/:id', name: 'docs', component: Document },
    { path: encodeURI('/n/€'), name: 'euro', component },
  ],
})

// use the router
Vue.use(plugin)

// @ts-ignore
window.vm = new Vue({
  el: '#app',
  // @ts-ignore
  router,
})
