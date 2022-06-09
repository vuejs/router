import '../global.css'
import { RouteComponent, createRouter, createWebHistory } from 'vue-router'
import { createApp, ref, watchEffect, App, inject } from 'vue'

const Home: RouteComponent = {
  template: `<div class="home">Home</div>`,
}

const User: RouteComponent = {
  template: `<div class="user">User {{ $route.params.id }}. Updated <span class="count">{{ count }}</span></div>`,
  data: () => ({ count: 0 }),

  beforeRouteEnter(to, from, next) {
    next(vm => {
      // @ts-expect-error
      console.log('enter from ', vm.id)
    })
  },

  beforeRouteUpdate(to, from, next) {
    // this.count++
    next()
  },

  setup() {
    const id = inject('id')!

    return { id }
  },
}

let looper = [1, 2, 3]

const NamedViews: RouteComponent[] = looper.map(i => ({
  name: 'part-' + i,

  template: `<div class="named" id="part-${i}">Part ${i}. Updated <span class="count">{{ count }}</span></div>`,

  data: () => ({ count: 0 }),

  beforeRouteUpdate(to, from, next) {
    console.log('update of', i)
    // @ts-expect-error
    this.count++
    next()
  },
}))

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
  history: createWebHistory('/multi-app'),
  routes: [
    { path: '/', component: Home },
    {
      path: '/users/:id',
      components: {
        default: User,
        ...NamedViews.reduce(
          (routeComponents, component) => ({
            ...routeComponents,
            [component.name!]: component,
          }),
          {} as Record<string, RouteComponent>
        ),
      },
    },
  ],
})

router.beforeEach((to, from, next) => {
  guardCallCount.value++
  next()
})

let apps: Array<App | null> = [null, null, null]

looper.forEach((n, i) => {
  let mountBtn = document.getElementById('mount' + n)!
  let unmountBtn = document.getElementById('unmount' + n)!

  mountBtn.addEventListener('click', () => {
    let app = (apps[i] = createApp({
      template: `
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/users/1">User 1</router-link></li>
        <li><router-link to="/users/2">User 2</router-link></li>
      </ul>

      <router-view></router-view>
      <router-view name="part-${n}"></router-view>
  `,
    }))
    app.use(router)
    app.provide('id', n)
    app.mount('#app-' + n)
  })

  unmountBtn.addEventListener('click', () => {
    let app = apps[i]
    app && app.unmount()
  })
})
