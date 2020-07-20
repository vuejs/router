import {
  NavigationGuard,
  RouteLocationNormalizedLoaded,
  NavigationGuardWithThis,
} from './types'
import { Router } from './router'

export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'

export {
  LocationQuery,
  parseQuery,
  stringifyQuery,
  LocationQueryRaw,
  LocationQueryValue,
} from './query'

export { RouterHistory } from './history/common'

export { RouteRecord, RouteRecordNormalized } from './matcher/types'
export {
  PathParserOptions,
  _PathParserOptions,
} from './matcher/pathParserRanker'

export {
  _RouteLocationBase,
  _RouteRecordBase,
  RouteLocationRaw,
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  START_LOCATION_NORMALIZED as START_LOCATION,
  RouteParams,
  RouteLocationMatched,
  RouteLocationOptions,
  RouteRecordRaw,
  NavigationGuard,
  NavigationGuardNext,
  PostNavigationGuard,
} from './types'
export {
  createRouter,
  Router,
  RouterOptions,
  ErrorHandler,
  ScrollBehavior,
} from './router'

// waiting for RFC isNavigationFailure to be merged
// https://github.com/vuejs/rfcs/pull/184
export { NavigationFailureType, NavigationFailure } from './errors'

export { onBeforeRouteLeave, onBeforeRouteUpdate } from './navigationGuards'
export { RouterLink, useLink, RouterLinkProps } from './RouterLink'
export { RouterView, RouterViewProps } from './RouterView'

export * from './useApi'

declare module '@vue/runtime-core' {
  interface ComponentCustomOptions {
    /**
     * Guard called when the router is navigating to the route that is rendering
     * this component from a different route. Differently from `beforeRouteUpdate`
     * and `beforeRouteLeave`, `beforeRouteEnter` does not have access to the
     * component instance through `this` because it triggers before the component
     * is even mounted.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteEnter?: NavigationGuardWithThis<undefined>

    /**
     * Guard called whenever the route that renders this component has changed but
     * it is reused for the new route. This allows you to guard for changes in
     * params, the query or the hash.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteUpdate?: NavigationGuard

    /**
     * Guard called when the router is navigating away from the current route that
     * is rendering this component.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteLeave?: NavigationGuard
  }

  interface ComponentCustomProperties {
    /**
     * Normalized current location. See {@link RouteLocationNormalizedLoaded}.
     */
    $route: RouteLocationNormalizedLoaded
    /**
     * {@link Router} instance used by the application.
     */
    $router: Router
  }
}
