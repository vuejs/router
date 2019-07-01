// @ts-nocheck

import { Component } from 'vue'

const View: Component = {
  name: 'RouterView',
  functional: true,

  props: {
    name: {
      type: String,
      default: 'default',
    },
  },

  render(_, { children, parent, data, props }) {
    // @ts-ignore used by devtools to display a router-view badge
    data.routerView = true

    // directly use parent context's createElement() function
    // so that components rendered by router-view can resolve named slots
    const h = parent.$createElement
    // @ts-ignore $route is added by our typings
    const route = parent.$route

    // determine current view depth, also check to see if the tree
    // has been toggled inactive but kept-alive.
    let depth = 0
    // let inactive = false
    // @ts-ignore
    while (parent && parent._routerRoot !== parent) {
      const vnodeData = parent.$vnode && parent.$vnode.data
      if (vnodeData) {
        // @ts-ignore
        if (vnodeData.routerView) {
          depth++
        }
        // if (vnodeData.keepAlive && parent._inactive) {
        //   inactive = true
        // }
      }
      parent = parent.$parent
    }
    // @ts-ignore for devtools
    data.routerViewDepth = depth

    // TODO: support nested router-views
    const matched = route.matched[depth]

    // render empty node if no matched route
    if (!matched) return h()

    const component = matched.components[props.name]

    return h(component, data, children)
  },
}

export default View
