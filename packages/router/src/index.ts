/**
 * The official Router for Vue 3.
 *
 * @packageDocumentation
 */

export { createWebHashHistory } from './history/hash'
export { createWebHistory } from './history/html5'
export { useHistoryState } from './history/state'
export { createMemoryHistory } from './history/memory'
export { createRouterMatcher } from './matcher'
export type { RouterMatcher } from './matcher'

export { parseQuery, stringifyQuery } from './query'
export type {
  LocationQuery,
  LocationQueryRaw,
  LocationQueryValue,
  LocationQueryValueRaw,
} from './query'

export type { HistoryState, RouterHistory } from './history/common'

export type { RouteRecord, RouteRecordNormalized } from './matcher/types'

export type {
  _PathParserOptions,
  PathParserOptions,
} from './matcher/pathParserRanker'

export {
  matchedRouteKey,
  routeLocationKey,
  routerKey,
  routerViewLocationKey,
  viewDepthKey,
} from './injectionSymbols'

export { START_LOCATION_NORMALIZED as START_LOCATION } from './location'
export type {
  _RouteLocationBase,
  _RouteRecordBase,
  LocationAsRelativeRaw,
  MatcherLocation,
  MatcherLocationAsPath,
  RouteComponent,
  // exported for backwards compat for old RouteLocationRaw
  RouteLocationMatched,
  RouteLocationNamedRaw,
  RouteLocationOptions,
  // exported for backwards compat for old RouteLocationRaw
  RouteLocationPathRaw,
  RouteMeta,
  // RawRouteComponent,
  RouteParamsGeneric,
  RouteParamsRawGeneric,
  RouteParamValue,
  RouteParamValueRaw,
  RouteQueryAndHash,
  RouteRecordMultipleViews,
  RouteRecordMultipleViewsWithChildren,
  RouteRecordRaw,
  RouteRecordRedirect,
  RouteRecordSingleView,
  RouteRecordSingleViewWithChildren,
} from './types'
export type { _Awaitable } from './types/utils'

// Experimental Type Safe API
export type {
  _RouteRecordProps,
  // navigation guards
  NavigationGuard,
  NavigationGuardNext,
  NavigationGuardNextCallback,
  NavigationGuardReturn,
  NavigationGuardWithThis,
  NavigationHookAfter,
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,
  RouteLocation,
  // as path
  RouteLocationAsPath,
  RouteLocationAsPathGeneric,
  RouteLocationAsPathTyped,
  RouteLocationAsPathTypedList,
  // relative
  RouteLocationAsRelative,
  RouteLocationAsRelativeGeneric,
  RouteLocationAsRelativeTyped,
  RouteLocationAsRelativeTypedList,
  // string
  RouteLocationAsString,
  RouteLocationAsStringTyped,
  RouteLocationAsStringTypedList,
  RouteLocationGeneric,
  RouteLocationNormalized,
  RouteLocationNormalizedGeneric,
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedGeneric,
  RouteLocationNormalizedLoadedTyped,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationNormalizedTyped,
  RouteLocationNormalizedTypedList,
  RouteLocationRaw,
  RouteLocationResolved,
  RouteLocationResolvedGeneric,
  RouteLocationResolvedTyped,
  RouteLocationResolvedTypedList,
  RouteLocationTyped,
  RouteLocationTypedList,
  RouteMap,
  RouteMapGeneric,
  // params
  RouteParams,
  RouteParamsRaw,
  RouteRecordInfo,
  // route records
  RouteRecordInfoGeneric,
  RouteRecordName,
  RouteRecordNameGeneric,
  RouteRecordRedirectOption,
} from './typed-routes'

export { createRouter } from './router'
export type {
  RouterClassic as _RouterClassic,
  Router,
  RouterOptions,
} from './router'
export type { RouterScrollBehavior } from './scrollBehavior'

export { isNavigationFailure, NavigationFailureType } from './errors'
export type {
  ErrorTypes,
  NavigationFailure,
  NavigationRedirectError,
} from './errors'

export type { TypesConfig } from './config'
export {
  loadRouteLocation,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from './navigationGuards'
export { RouterLink, useLink } from './RouterLink'
export type {
  _RouterLinkI,
  RouterLinkProps,
  UseLinkOptions,
  UseLinkReturn,
} from './RouterLink'
export { RouterView } from './RouterView'
export type { RouterViewProps } from './RouterView'

export * from './useApi'

// Global extensions for Vue
import type { TypesConfig } from './config'
import type { Router } from './router'
import type { RouterLink } from './RouterLink'
import type { RouterView } from './RouterView'
import type {
  NavigationGuard,
  NavigationGuardWithThis,
  RouteLocationNormalizedLoaded,
} from './typed-routes'

declare module 'vue' {
  export interface ComponentCustomOptions {
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
    beforeRouteEnter?: TypesConfig extends Record<'beforeRouteEnter', infer T>
      ? T
      : NavigationGuardWithThis<undefined>

    /**
     * Guard called whenever the route that renders this component has changed, but
     * it is reused for the new route. This allows you to guard for changes in
     * params, the query or the hash.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteUpdate?: TypesConfig extends Record<'beforeRouteUpdate', infer T>
      ? T
      : NavigationGuard

    /**
     * Guard called when the router is navigating away from the current route that
     * is rendering this component.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteLeave?: TypesConfig extends Record<'beforeRouteLeave', infer T>
      ? T
      : NavigationGuard
  }

  export interface ComponentCustomProperties {
    /**
     * Normalized current location. See {@link RouteLocationNormalizedLoaded}.
     */
    $route: TypesConfig extends Record<'$route', infer T>
      ? T
      : RouteLocationNormalizedLoaded
    /**
     * {@link Router} instance used by the application.
     */
    $router: TypesConfig extends Record<'$router', infer T> ? T : Router
  }

  export interface GlobalComponents {
    RouterView: TypesConfig extends Record<'RouterView', infer T>
      ? T
      : typeof RouterView
    RouterLink: TypesConfig extends Record<'RouterLink', infer T>
      ? T
      : typeof RouterLink
  }
}
