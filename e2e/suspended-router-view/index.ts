import { createRouter, createWebHistory } from '../../src'
import { createApp, defineComponent, onErrorCaptured } from 'vue'

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

const ViewData = defineComponent({
  template: `
  <div>
    <h1>With Data</h1>

    <router-view/>

  </div>
  `,

  async setup() {
    await delay(300)

    throw new Error('oops')

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
      ],
    },
    {
      path: '/data-2',
      component: ViewData,
      children: [
        { path: '', component: ViewRegular },
        { path: 'data', component: ViewData },
      ],
    },
  ],
})

const app = createApp({
  setup() {
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

    return { onPending, onResolve, onFallback }
  },

  template: `
    <div id="app">
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/data">Suspended</router-link></li>
        <li><router-link to="/data/data">Suspended nested</router-link></li>
        <li><router-link to="/data-2">Suspended (2)</router-link></li>
        <li><router-link to="/data-2/data">Suspended nested (2)</router-link></li>
      </ul>

      <router-view-suspended />

    </div>
  `,
})
app.use(router)

window.vm = app.mount('#app')
window.r = router
