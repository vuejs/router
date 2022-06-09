import '../global.css'
import { RouteComponent, createRouter, createWebHistory } from 'vue-router'
import { createApp, defineComponent, nextTick, ref } from 'vue'

// const delay = (t: number) => new Promise(r => setTimeout(r, t))

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

const Parent = defineComponent({
  data() {
    return {
      transitionName: 'slide-right',
    }
  },
  async beforeRouteUpdate(to, from, next) {
    const toDepth = to.path.split('/').length
    const fromDepth = from.path.split('/').length

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
})

const NestedTransition = defineComponent({
  template: `
      <router-view class="nested-view" mode="out-in" v-slot="{ Component }">
        <transition name="none">
          <component :is="Component" />
        </transition>
      </router-view>
  `,
})

const Default: RouteComponent = {
  template: '<div class="default">default</div>',
}
const Foo: RouteComponent = { template: '<div class="foo">foo</div>' }
const Bar: RouteComponent = { template: '<div class="bar">bar</div>' }

const webHistory = createWebHistory('/transitions')
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

    {
      path: '/nested',
      component: NestedTransition,
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
    const transitionName = ref('fade')
    function toggleTransition() {
      transitionName.value = transitionName.value === 'fade' ? 'none' : 'fade'
    }

    return {
      transitionName,
      toggleTransition,
    }
  },

  template: `
    <h1>Transitions</h1>
    <pre>CI: ${__CI__}</pre>
    <button id="toggle-transition" @click="toggleTransition">Toggle Transition</button>
    <ul>
      <li><router-link to="/">/</router-link></li>
      <li><router-link to="/parent">/parent</router-link></li>
      <li><router-link to="/parent/foo">/parent/foo</router-link></li>
      <li><router-link to="/parent/bar">/parent/bar</router-link></li>
      <li><router-link to="/not-found">Not existing</router-link></li>

        <li><router-link to="/nested">/nested</router-link></li>
        <li><router-link to="/nested/foo">/nested/foo</router-link></li>
        <li><router-link to="/nested/bar">/nested/bar</router-link></li>
      </ul>
      <router-view class="view" v-slot="{ Component }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
  `,
})
app.use(router)

// wait to avoid initial transition
router.isReady().then(() => (window.vm = app.mount('#app')))
