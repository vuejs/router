import { createRouter, createWebHistory } from 'vue-router'
import { createApp, defineComponent } from 'vue'
import { onRouteRendered } from 'vue-router/experimental'

declare global {
  interface Window {
    settled: Array<{
      path: string
      depth: number
      view: string
      leaving: number
    }>
    rootNavigations: Array<{ path: string; view: string }>
  }
}

window.settled = []
window.rootNavigations = []

const viewText = () => document.querySelector('#view')!.textContent!.trim()

// depth of the closest RouterView
function track(depth: number) {
  onRouteRendered(to => {
    window.settled.push({
      depth,
      path: to.fullPath,
      view: viewText(),
      leaving: document.querySelectorAll('.fade-leave-active').length,
    })
  })
}

const page = (name: string, depth = 0) =>
  defineComponent({
    name,
    setup: () => track(depth),
    template: `<p>${name} {{ $route.fullPath }}</p>`,
  })

const AsyncPage = defineComponent({
  name: 'AsyncPage',
  async setup() {
    track(0)
    await new Promise(resolve => setTimeout(resolve, 400))
    return {}
  },
  template: '<p>Async {{ $route.fullPath }}</p>',
})

let itemInstances = 0
const Item = defineComponent({
  name: 'Item',
  setup() {
    track(1)
    return { instance: ++itemInstances }
  },
  template: '<p>Item #{{ instance }} {{ $route.fullPath }}</p>',
})

const router = createRouter({
  history: createWebHistory('/route-rendered/'),
  routes: [
    { path: '/', component: page('Home') },
    { path: '/a', component: page('A') },
    { path: '/b', component: page('B') },
    { path: '/async', component: AsyncPage },
    { path: '/user/:id', component: page('User') },
    {
      path: '/keyed',
      component: defineComponent({
        name: 'Keyed',
        setup: () => track(0),
        template: `
          <div>
            Keyed
            <router-view v-slot="{ Component, route }">
              <transition name="fade" mode="out-in">
                <component :is="Component" :key="route.path" />
              </transition>
            </router-view>
          </div>
        `,
      }),
      children: [{ path: ':id', component: Item }],
    },
    {
      path: '/nested',
      component: defineComponent({
        name: 'Parent',
        setup: () => track(0),
        template: '<div>Parent <RouterView /></div>',
      }),
      children: [
        { path: 'x', component: page('X', 1) },
        { path: 'y', component: page('Y', 1) },
      ],
    },
  ],
})

const app = createApp({
  setup() {
    // outside of any RouterView: afterEach
    onRouteRendered(to => {
      window.rootNavigations.push({ path: to.fullPath, view: viewText() })
    })
  },
  template: `
    <nav>
      <ul>
        <li><router-link to="/a">a</router-link></li>
        <li><router-link to="/b">b</router-link></li>
        <li><router-link to="/async">async</router-link></li>
        <li><router-link to="/user/1">user 1</router-link></li>
        <li><router-link to="/user/2">user 2</router-link></li>
        <li><router-link to="/nested/x">nested x</router-link></li>
        <li><router-link to="/nested/y">nested y</router-link></li>
        <li><router-link to="/user/2?tab=posts">user 2 posts</router-link></li>
        <li><router-link to="/user/2?tab=likes">user 2 likes</router-link></li>
        <li><router-link to="/user/2#bio">user 2 #bio</router-link></li>
        <li><router-link to="/user/2#links">user 2 #links</router-link></li>
        <li><router-link to="/nested/y?tab=posts">nested y posts</router-link></li>
        <li><router-link to="/nested/y#bio">nested y #bio</router-link></li>
        <li><router-link to="/keyed/1">keyed 1</router-link></li>
        <li><router-link to="/keyed/2">keyed 2</router-link></li>
        <li><router-link to="/keyed/2?tab=posts">keyed 2 posts</router-link></li>
        <li><router-link to="/keyed/2#bio">keyed 2 #bio</router-link></li>
      </ul>
    </nav>
    <div id="view">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <suspense>
              <component :is="Component" />
            </suspense>
          </keep-alive>
        </transition>
      </router-view>
    </div>
  `,
})
app.use(router)
router.isReady().then(() => app.mount('#app'))
