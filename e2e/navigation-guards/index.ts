import { createRouter, createWebHistory, onBeforeRouteLeave } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp, ref } from 'vue'

const Home: RouteComponent = {
  template: `<div>Home</div>`,
}

const GuardedWithLeave: RouteComponent = {
  name: 'GuardedWithLeave',

  template: `
  <div>
    <p>try to leave</p>
    <p id="tries">So far, you tried {{ tries }} times</p>
  </div>
  `,

  setup() {
    console.log('setup in cant leave')
    const tries = ref(0)

    onBeforeRouteLeave(function(to, from, next) {
      if (window.confirm()) next()
      else {
        tries.value++
        next(false)
      }
    })
    return { tries }
  },
}

const router = createRouter({
  history: createWebHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home, name: 'home' },
    { path: '/cant-leave', component: GuardedWithLeave },
  ],
})

const app = createApp({})
app.use(router)

window.vm = app.mount('#app')
window.r = router
