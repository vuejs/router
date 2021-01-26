import { createRouter, createWebHistory, useRoute } from '../../src'
import { computed, createApp, defineComponent, onErrorCaptured } from 'vue'

// override existing style on dev with shorter times
if (!__CI__) {
  const transitionDuration = '0.3s'
  const styleEl = document.createElement('style')
  styleEl.innerHTML = `
.fade-enter-active,
.fade-leave-active {
  transition: opacity ${transitionDuration} ease;
}
`
  document.head.append(styleEl)
}

const delay = (t: number) => new Promise(r => setTimeout(r, t))

const Home = defineComponent({
  template: `
  <div>
    <h1>Home</h1>
  </div>`,
})

const ViewRegular = defineComponent({
  template: '<div>Regular</div>',
})

const ViewId = defineComponent({
  template: '<div>Id: {{ $route.params.id }}</div>',
})

const ViewData = defineComponent({
  template: `
  <div>
    <h1>With Data</h1>
    <p>{{ $route.path }}</p>

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <suspense :timeout="0">
          <component :is="Component" />
        </suspense>
      </transition>
    </router-view>


  </div>
  `,

  async setup() {
    await delay(300)

    // throw new Error('oops')

    return {}
  },
})

const router = createRouter({
  history: createWebHistory('/' + __dirname),
  routes: [
    { path: '/', component: Home },
    {
      path: '/data',
      component: ViewData,
      children: [
        { path: '', component: ViewRegular },
        { path: 'data', component: ViewData },
        { path: ':id', name: 'id1', component: ViewId },
      ],
    },
    {
      path: '/data-2',
      component: ViewData,
      children: [
        { path: '', component: ViewRegular },
        { path: 'data', component: ViewData },
        { path: ':id', name: 'id2', component: ViewId },
      ],
    },
  ],
})

const app = createApp({
  setup() {
    const route = useRoute()
    function onPending() {
      console.log('onPending')
    }
    function onResolve() {
      console.log('onResolve')
    }
    function onFallback() {
      console.log('onFallback')
    }

    onErrorCaptured((err, target, info) => {
      console.log('caught', err, target, info)
    })

    const nextId = computed(() => (Number(route.params.id) || 0) + 1)

    return { onPending, onResolve, onFallback, nextId }
  },

  template: `
    <div id="app">
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/data">Suspended</router-link></li>
        <li><router-link to="/data/data">Suspended nested</router-link></li>
        <li><router-link :to="{ name: 'id1', params: { id: nextId }}">/data/{{ nextId }}</router-link></li>

        <li><router-link to="/data-2">Suspended (2)</router-link></li>
        <li><router-link to="/data-2/data">Suspended nested (2)</router-link></li>
        <li><router-link :to="{ name: 'id2', params: { id: nextId }}">/data/{{ nextId }}</router-link></li>
      </ul>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <suspense :timeout="0">
            <component :is="Component" />
          </suspense>
        </transition>
      </router-view>

    </div>
  `,
})
app.use(router)
// app.component('RouterView', RouterViewSuspended)

window.vm = app.mount('#app')
window.r = router
