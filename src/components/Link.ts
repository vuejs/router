import { Component } from 'vue'
import { Router } from '../router'
import { RouteLocationNormalized, RouteLocation } from '../types'

const Link: Component = {
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object],
      required: true,
    },
  },

  render(h) {
    // @ts-ignore
    const router = this.$router as Router
    // @ts-ignore
    const from = this.$route as RouteLocationNormalized
    // @ts-ignore
    const to = this.to as RouteLocation
    // @ts-ignore
    let url: HistoryLocationNormalized
    let location: RouteLocationNormalized
    // TODO: refactor router code and use its function istead of having a copied version here
    if (typeof to === 'string' || 'path' in to) {
      // @ts-ignore
      url = router.history.utils.normalizeLocation(to)
      // TODO: should allow a non matching url to allow dynamic routing to work
      location = router.resolveLocation(url, from)
    } else {
      // named or relative route
      // @ts-ignore
      const query = router.history.utils.normalizeQuery(
        to.query ? to.query : {}
      )
      const hash = to.hash || ''
      // we need to resolve first
      location = router.resolveLocation({ ...to, query, hash }, from)
      // intentionally drop current query and hash
      // @ts-ignore
      url = router.history.utils.normalizeLocation({
        query,
        hash,
        ...location,
      })
    }
    const route = router.resolveLocation(url, from)

    // TODO: active classes
    // TODO: handle replace prop

    const handler = (e: MouseEvent) => {
      if (guardEvent(e)) {
        router.push(route)
      }
    }

    const on = { click: handler }

    const data: any = {
      on,
      attrs: { href: route.fullPath },
    }

    // @ts-ignore
    return h('a', data, this.$slots.default)
  },
}

function guardEvent(e: MouseEvent) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return
  // don't redirect if `target="_blank"`
  // @ts-ignore
  if (e.currentTarget && e.currentTarget.getAttribute) {
    // @ts-ignore
    const target = e.currentTarget.getAttribute('target')
    if (/\b_blank\b/i.test(target)) return
  }
  // this may be a Weex event which doesn't have this method
  if (e.preventDefault) {
    e.preventDefault()
  }
  return true
}

export default Link
