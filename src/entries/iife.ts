import { Router as BaseRouter, plugin, HTML5History } from '../index'
import { RouterOptions } from '../router'
import { VueConstructor } from 'vue'

export default class VueRouter extends BaseRouter {
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
