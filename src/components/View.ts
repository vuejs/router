// @ts-nocheck

import { Component } from 'vue'

const View: Component = {
  name: 'RouterView',
  functional: true,

  render(_, { children, parent, data }) {
    // used by devtools to display a router-view badge
    // @ts-ignore
    data.routerView = true

    // directly use parent context's createElement() function
    // so that components rendered by router-view can resolve named slots
    const h = parent.$createElement
    // @ts-ignore
    const route = parent.$route

    // TODO: support nested router-views
    const matched = route.matched[0]

    // render empty node if no matched route
    if (!matched) return h()

    const component = matched.component

    return h(component, data, children)
  },
}

export default View
