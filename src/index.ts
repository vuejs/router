import { Router, RouterOptions } from './router'
import { HTML5History } from './history/html5'
import { HashHistory } from './history/hash'
import { AbstractHistory } from './history/abstract'
import { BaseHistory } from './history/base'
import { PluginFunction, VueConstructor } from 'vue'
import View from './components/View'
import Link from './components/Link'

// TODO: type things

const plugin: PluginFunction<void> = Vue => {
  Vue.mixin({
    beforeCreate() {
      if ('router' in this.$options) {
        // @ts-ignore we are adding this
        this._routerRoot = this
        // @ts-ignore should be able to be removed once we add the typing
        const router = this.$options.router as Router
        // @ts-ignore _router is internal
        this._router = router
        // this._router.init(this)
        // @ts-ignore
        this._router.app = this
        // @ts-ignore we can use but should not be used by others
        Vue.util.defineReactive(
          this,
          '_route',
          router.currentRoute
          // undefined,
          // true
        )

        router.doInitialNavigation().catch(() => {})
      } else {
        // @ts-ignore we are adding this
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

  // @ts-ignore FIXME: should work
  Vue.component('RouterView', View)
  // @ts-ignore FIXME: should work
  Vue.component('RouterLink', Link)
  // Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate =
    strats.created
}

export {
  Router,
  HTML5History,
  HashHistory,
  AbstractHistory,
  BaseHistory,
  plugin,
}

// TODO: refactor somewhere else
const inBrowser = typeof window !== 'undefined'

const HistoryMode = {
  history: HTML5History,
  hash: HashHistory,
  abstract: AbstractHistory,
}

export default class VueRouter extends Router {
  static install = plugin
  static version = '__VERSION__'

  // TODO: handle mode in a retro compatible way
  constructor(
    options: Partial<RouterOptions & { mode: 'history' | 'abstract' | 'hash' }>
  ) {
    let { mode } = options
    if (!inBrowser) mode = 'abstract'
    super({
      ...options,
      routes: options.routes || [],
      history: new HistoryMode[mode || 'hash'](),
    })
  }
}

declare global {
  interface Window {
    Vue: VueConstructor
  }
}

if (typeof window !== 'undefined' && window.Vue) window.Vue.use(VueRouter)
