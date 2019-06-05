import { Router } from './router'
import { HTML5History } from './history/html5'
import { PluginFunction } from 'vue'
import View from './components/View'

const plugin: PluginFunction<void> = Vue => {
  Vue.mixin({
    beforeCreate() {
      // @ts-ignore
      if (this.$options.router) {
        // @ts-ignore
        this._routerRoot = this
        // @ts-ignore
        this._router = this.$options.router
        // this._router.init(this)
        // @ts-ignore
        Vue.util.defineReactive(this, '_route', this._router.currentRoute)
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
  // Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate =
    strats.created
}

export { Router, HTML5History, plugin }
