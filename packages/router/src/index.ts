/**
 * The official Router for Vue 3.
 *
 * @packageDocumentation
 */

export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'
export { createRouterMatcher } from './matcher'
export type { RouterMatcher } from './matcher'

export { parseQuery, stringifyQuery } from './query'
export type {
  LocationQuery,
  LocationQueryRaw,
  LocationQueryValue,
  LocationQueryValueRaw,
} from './query'

export type { RouterHistory, HistoryState } from './history/common'

export type { RouteRecord, RouteRecordNormalized } from './matcher/types'

export type {
  PathParserOptions,
  _PathParserOptions,
} from './matcher/pathParserRanker'

export {
  routeLocationKey,
  routerViewLocationKey,
  routerKey,
  matchedRouteKey,
  viewDepthKey,
} from './injectionSymbols'

export { START_LOCATION_NORMALIZED as START_LOCATION } from './location'
export type {
  // route location
  _RouteLocationBase,
  MatcherLocationAsPath,
  LocationAsRelativeRaw,
  RouteQueryAndHash,

  // route params
  RouteParamValue,
  RouteParamValueRaw,

  // Partial route location
  RouteLocationNamedRaw,
  // exported for backwards compat for old RouteLocationRaw
  RouteLocationPathRaw,
  RouteLocationMatched,

  // extra options when navigating
  RouteLocationOptions,

  // route records
  _RouteRecordBase,
  RouteRecordRaw,
  RouteRecordSingleView,
  RouteRecordSingleViewWithChildren,
  RouteRecordMultipleViews,
  RouteRecordMultipleViewsWithChildren,
  RouteRecordRedirect,
  RouteMeta,
  RouteComponent,
  // RawRouteComponent,
  RouteParamsGeneric,
  RouteParamsRawGeneric,
  MatcherLocation,
} from './types'
export type { _Awaitable } from './types/utils'

// Experimental Type Safe API
export type {
  RouteMap,
  RouteMapGeneric,

  // route location
  RouteLocationRaw,
  RouteLocation,
  RouteLocationGeneric,
  RouteLocationTyped,
  RouteLocationTypedList,

  // RouteLocationNormalized
  RouteLocationNormalizedGeneric,
  RouteLocationNormalized,
  RouteLocationNormalizedTyped,
  RouteLocationNormalizedTypedList,

  // RouteLocationNormalizedLoaded
  RouteLocationNormalizedLoadedGeneric,
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedTyped,
  RouteLocationNormalizedLoadedTypedList,

  // RouteLocationResolved
  RouteLocationResolvedGeneric,
  RouteLocationResolved,
  RouteLocationResolvedTyped,
  RouteLocationResolvedTypedList,

  // relative
  RouteLocationAsRelativeGeneric,
  RouteLocationAsRelative,
  RouteLocationAsRelativeTyped,
  RouteLocationAsRelativeTypedList,
  // string
  RouteLocationAsStringTyped,
  RouteLocationAsString,
  RouteLocationAsStringTypedList,
  // as path
  RouteLocationAsPathGeneric,
  RouteLocationAsPath,
  RouteLocationAsPathTyped,
  RouteLocationAsPathTypedList,

  // route records
  RouteRecordInfoGeneric,
  RouteRecordInfo,
  RouteRecordNameGeneric,
  RouteRecordName,
  _RouteRecordProps,
  RouteRecordRedirectOption,

  // params
  RouteParams,
  RouteParamsRaw,
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,

  // navigation guards
  NavigationGuard,
  NavigationGuardWithThis,
  NavigationHookAfter,
  NavigationGuardReturn,
  NavigationGuardNext,
  NavigationGuardNextCallback,
} from './typed-routes'

export { createRouter } from './router'
export type { Router, RouterOptions } from './router'
export type { RouterScrollBehavior } from './scrollBehavior'

export { NavigationFailureType, isNavigationFailure } from './errors'
export type {
  NavigationFailure,
  ErrorTypes,
  NavigationRedirectError,
} from './errors'

export {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  loadRouteLocation,
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

export type { TypesConfig } from './config'

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
