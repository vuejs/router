import { RouteLocationNormalized } from '../typed-routes'
import { START_LOCATION } from '../index'

// from Nuxt
const ROUTE_KEY_PARENTHESES_RE = /(:\w+)\([^)]+\)/g
const ROUTE_KEY_SYMBOLS_RE = /(:\w+)[?+*]/g
const ROUTE_KEY_NORMAL_RE = /:\w+/g
// TODO: consider refactoring into single utility
// See https://github.com/nuxt/nuxt/tree/main/packages/nuxt/src/pages/runtime/utils.ts#L8-L19
function generateRouteKey(route: RouteLocationNormalized) {
  const source =
    route?.meta.key ??
    route.path
      .replace(ROUTE_KEY_PARENTHESES_RE, '$1')
      .replace(ROUTE_KEY_SYMBOLS_RE, '$1')
      .replace(
        ROUTE_KEY_NORMAL_RE,
        r => route.params[r.slice(1)]?.toString() || ''
      )
  return typeof source === 'function' ? source(route) : source
}

export function isChangingPage(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  if (to === from || from === START_LOCATION) {
    return false
  }

  // If route keys are different then it will result in a rerender
  if (generateRouteKey(to) !== generateRouteKey(from)) {
    return true
  }

  const areComponentsSame = to.matched.every(
    (comp, index) =>
      comp.components &&
      comp.components.default === from.matched[index]?.components?.default
  )
  return !areComponentsSame
}
