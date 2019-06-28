import { Router, RouterOptions } from './router'
import { HTML5History } from './history/html5'
import { PluginFunction, VueConstructor } from 'vue'
import View from './components/View'
import Link from './components/Link'

// TODO: type things

const plugin: PluginFunction<void> = Vue => {
  Vue.mixin({
    beforeCreate() {
      // @ts-ignore
      if (this.$options.router) {
        // @ts-ignore
        this._routerRoot = this
        // @ts-ignore
        this._router = this.$options.router as Router
        // this._router.init(this)
        // @ts-ignore
        this._router.app = this
        // @ts-ignore
        Vue.util.defineReactive(
          // @ts-ignore
          this,
          '_route',
          // @ts-ignore
          this._router.currentRoute
          // undefined,
          // true
        )

        // @ts-ignore
        this._router.doInitialNavigation()
      } else {
        // @ts-ignore
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
    },
  })

  Object.defineProperty(Vue.prototype, '$router', {
    get() {
      return this._routerRoot._router
    },
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get() {
      return this._routerRoot._route
    },
  })

  // @ts-ignore
  Vue.component('RouterView', View)
  // @ts-ignore
  Vue.component('RouterLink', Link)
  // Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate =
    strats.created
}

export { Router, HTML5History, plugin }

export default class VueRouter extends Router {
  static install = plugin
  static version = '__VERSION__'

  // TODO: handle mode in a retro compatible way
  constructor(options: RouterOptions & { mode: 'string' }) {
    super({
      history: new HTML5History(),
      ...options,
    })
  }
}

declare global {
  interface Window {
    Vue?: VueConstructor
  }
}

if (window.Vue) window.Vue.use(VueRouter)
