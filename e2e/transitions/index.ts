import { createRouter, createWebHistory, useRoute } from '../../src'
import { RouteComponent } from '../../src/types'
import { createApp, nextTick } from 'vue'

const Home: RouteComponent = {
  template: `
    <div class="home">
      <h2>Home</h2>
      <p>hello</p>
    </div>
  `,
}

// override existing style on dev with shorter times
if (!__CI__) {
  const transitionDuration = '0.5s'
  const styleEl = document.createElement('style')
  styleEl.innerHTML = `
.fade-enter-active,
.fade-leave-active {
  transition: opacity ${transitionDuration} ease;
}
.child-view {
  position: absolute;
  transition: all ${transitionDuration} cubic-bezier(0.55, 0, 0.1, 1);
}
`
  document.head.append(styleEl)
}

const Parent: RouteComponent = {
  data() {
    return {
      transitionName: 'slide-right',
    }
  },
  async beforeRouteUpdate(to, from, next) {
    const toDepth = to.path.split('/').length
    const fromDepth = from.path.split('/').length

    // @ts-ignore: move to composition api, cannot type `this` yet
    this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
    await nextTick()
    next()
  },
  template: `
    <div class="parent">
      <h2>Parent</h2>
      {{ transitionName }}
      <router-view class="child-view" v-slot="{ Component, route }">
        <transition :name="transitionName">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  `,
}

const Default: RouteComponent = {
  template: '<div class="default">default</div>',
}
const Foo: RouteComponent = { template: '<div class="foo">foo</div>' }
const Bar: RouteComponent = { template: '<div class="bar">bar</div>' }

const webHistory = createWebHistory('/' + __dirname)
const router = createRouter({
  history: webHistory,
  routes: [
    { path: '/', component: Home },
    {
      path: '/parent',
      component: Parent,
      children: [
        { path: '', component: Default },
        { path: 'foo', component: Foo },
        { path: 'bar', component: Bar },
      ],
    },
  ],
})
const app = createApp({
  setup() {
    return {
      show: true,
      route: useRoute(),
    }
  },

  template: `
    <div id="app">
      <h1>Transitions</h1>
      <pre>CI: ${__CI__}</pre>
      <ul>
        <li><router-link to="/">/</router-link></li>
        <li><router-link to="/parent">/parent</router-link></li>
        <li><router-link to="/parent/foo">/parent/foo</router-link></li>
        <li><router-link to="/parent/bar">/parent/bar</router-link></li>
        <li><router-link to="/not-found">Not existing</router-link></li>
      </ul>
      <router-view class="view" v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  `,
})
app.use(router)

// wait to avoid initial transition
router.isReady().then(() => (window.vm = app.mount('#app')))
