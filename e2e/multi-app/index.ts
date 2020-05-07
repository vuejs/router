import { createRouter, createWebHistory } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp, ref, watchEffect } from 'vue'

const Home: RouteComponent = {
  template: `<div class="home">Home</div>`,
}

const User: RouteComponent = {
  template: `<div class="user">User {{ $route.params.id }}</div>`,
}

// path popstate listeners to track the call count
let activePopStateListeners = ref(0)
let guardCallCount = ref(0)
const popCountDiv = document.getElementById('popcount')!
const guardCountDiv = document.getElementById('guardcount')!

watchEffect(() => {
  popCountDiv.innerHTML = '' + activePopStateListeners.value
})

watchEffect(() => {
  guardCountDiv.innerHTML = '' + guardCallCount.value
})

const originalAddEventListener = window.addEventListener
const originalRemoveEventListener = window.removeEventListener
window.addEventListener = function (name: string, handler: any) {
  if (name === 'popstate') {
    activePopStateListeners.value++
  }
  return originalAddEventListener.call(this, name, handler)
}
window.removeEventListener = function (name: string, handler: any) {
  if (name === 'popstate') {
    activePopStateListeners.value--
  }
  return originalRemoveEventListener.call(this, name, handler)
}

const router = createRouter({
  history: createWebHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', component: User },
  ],
})

router.beforeEach((to, from, next) => {
  guardCallCount.value++
  next()
})

let looper = [1, 2, 3]

let apps = looper.map(i =>
  createApp({
    template: `
    <div id="app-${i}">
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/users/1">User 1</router-link></li>
        <li><router-link to="/users/2">User 2</router-link></li>
      </ul>

      <router-view></router-view>
    </div>
  `,
  })
)

looper.forEach((n, i) => {
  let mountBtn = document.getElementById('mount' + n)!
  let unmountBtn = document.getElementById('unmount' + n)!

  let app = apps[i]

  app.use(router)

  mountBtn.addEventListener('click', () => {
    app.mount('#app-' + n)
  })

  unmountBtn.addEventListener('click', () => {
    app.unmount('#app-' + n)
  })
})
