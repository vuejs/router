import { LocationQuery, LocationQueryRaw } from '../query'
import { PathParserOptions } from '../matcher'
import { Ref, ComputedRef, ComponentPublicInstance, Component } from 'vue'
import { RouteRecord, RouteRecordNormalized } from '../matcher/types'
import { HistoryState } from '../history/common'
import { NavigationFailure } from '../errors'

export type Lazy<T> = () => Promise<T>
export type Override<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

// TODO: find a better way to type readonly types. Readonly<T> is non recursive, maybe we should use it at multiple places. It would also allow preventing the problem Immutable create.
export type Immutable<T> = {
  readonly [P in keyof T]: Immutable<T[P]>
}

export type VueUseOptions<T> = {
  [k in keyof T]: Ref<T[k]> | T[k] | ComputedRef<T[k]>
}

export type TODO = any

export type RouteParamValue = string
export type RouteParamValueRaw = RouteParamValue | number
export type RouteParams = Record<string, RouteParamValue | RouteParamValue[]>
export type RouteParamsRaw = Record<
  string,
  RouteParamValueRaw | RouteParamValueRaw[]
>

// TODO: document, mark as internal and export intermediate types for RouteLocationRaw
export interface RouteQueryAndHash {
  query?: LocationQueryRaw
  hash?: string
}
export interface LocationAsPath {
  path: string
}

export interface LocationAsName {
  name: RouteRecordName
  params?: RouteParams
}

export interface LocationAsRelativeRaw {
  name?: RouteRecordName
  params?: RouteParamsRaw
}

export interface LocationAsRelative {
  params?: RouteParams
}

export interface RouteLocationOptions {
  /**
   * Replace the entry in the history instead of pushing a new entry
   */
  replace?: boolean
  /**
   * Triggers the navigation even if the location is the same as the current one
   */
  force?: boolean
  /**
   * State to save using the History API. This cannot contain any reactive values and some primitives like Symbols are forbidden. More info at TODO: link mdn
   */
  state?: HistoryState
}

/**
 * User-level route location
 */
export type RouteLocationRaw =
  | string
  | (RouteQueryAndHash & LocationAsPath & RouteLocationOptions)
  | (RouteQueryAndHash & LocationAsRelativeRaw & RouteLocationOptions)

export interface RouteLocationMatched extends RouteRecordNormalized {
  // components cannot be Lazy<RouteComponent>
  components: Record<string, RouteComponent>
}

/**
 * Base properties for a normalized route location.
 *
 * @internal
 */
export interface _RouteLocationBase {
  /**
   * Percentage encoded pathname section of the URL.
   */
  path: string
  /**
   * The whole location including the `search` and `hash`. This string is
   * percentage encoded.
   */
  fullPath: string
  /**
   * Object representation of the `search` property of the current location.
   */
  query: LocationQuery
  /**
   * Hash of the current location. If present, starts with a `#`.
   */
  hash: string
  /**
   * Name of the matched record
   */
  name: RouteRecordName | null | undefined
  /**
   * Object of decoded params extracted from the `path`.
   */
  params: RouteParams
  /**
   * Contains the location we were initially trying to access before ending up
   * on the current location.
   */
  redirectedFrom: RouteLocation | undefined
  /**
   * Merged `meta` properties from all of the matched route records.
   */
  meta: RouteMeta
}

// matched contains resolved components
/**
 * {@link RouteLocationRaw} with
 */
export interface RouteLocationNormalizedLoaded extends _RouteLocationBase {
  /**
   * Array of {@link RouteLocationMatched} containing only plain components (any
   * lazy-loaded components have been loaded and were replaced inside of the
   * `components` object) so it can be directly used to display routes. It
   * cannot contain redirect records either
   */
  matched: RouteLocationMatched[] // non-enumerable
}

/**
 * {@link RouteLocationRaw} resolved using the matcher
 */
export interface RouteLocation extends _RouteLocationBase {
  /**
   * Array of {@link RouteRecord} containing components as they were
   * passed when adding records. It can also contain redirect records. This
   * can't be used directly
   */
  matched: RouteRecord[] // non-enumerable
}

/**
 * Similar to {@link RouteLocation} but its
 * {@link RouteLocationNormalized.matched} cannot contain redirect records
 */
export interface RouteLocationNormalized extends _RouteLocationBase {
  /**
   * Array of {@link RouteRecordNormalized}
   */
  matched: RouteRecordNormalized[] // non-enumerable
}

export type RouteComponent = Component
export type RawRouteComponent = RouteComponent | Lazy<RouteComponent>

export type RouteRecordName = string | symbol

/**
 * @internal
 */
export type _RouteRecordProps =
  | boolean
  | Record<string, any>
  | ((to: RouteLocationNormalized) => Record<string, any>)

// TODO: could this be moved to matcher?
/**
 * Common properties among all kind of {@link RouteRecordRaw}
 * @internal
 */
export interface _RouteRecordBase extends PathParserOptions {
  /**
   * Path of the record. Should start with `/` unless the record is the child of
   * another record.
   *
   * @example `/users/:id` matches `/users/1` as well as `/users/posva`.
   */
  path: string
  /**
   * Where to redirect if the route is directly matched. The redirection happens
   * before any navigation guard and triggers a new navigation with the new
   * target location.
   */
  redirect?: RouteRecordRedirectOption
  /**
   * Array of nested routes.
   */
  children?: RouteRecordRaw[]
  /**
   * Aliases for the record. Allows defining extra paths that will behave like a
   * copy of the record. Allows having paths shorthands like `/users/:id` and
   * `/u/:id`. All `alias` and `path` values must share the same params.
   */
  alias?: string | string[]
  /**
   * Name for the route record.
   */
  name?: RouteRecordName
  /**
   * Before Enter guard specific to this record. Note `beforeEnter` has no
   * effect if the record has a `redirect` property.
   */
  beforeEnter?:
    | NavigationGuardWithThis<undefined>
    | NavigationGuardWithThis<undefined>[]
  /**
   * Arbitrary data attached to the record.
   */
  meta?: RouteMeta
}

/**
 * Interface to type `meta` fields in route records.
 */
export interface RouteMeta extends Record<string | number | symbol, any> {}

export type RouteRecordRedirectOption =
  | RouteLocationRaw
  | ((to: RouteLocation) => RouteLocationRaw)

/**
 * Route Record defining one single component with the `component` option.
 */
export interface RouteRecordSingleView extends _RouteRecordBase {
  /**
   * Component to display when the URL matches this route.
   */
  component: RawRouteComponent
  components?: never
  /**
   * Allow passing down params as props to the component rendered by `router-view`.
   */
  props?: _RouteRecordProps
}

/**
 * Route Record defining multiple named components with the `components` option.
 */
export interface RouteRecordMultipleViews extends _RouteRecordBase {
  /**
   * Components to display when the URL matches this route. Allow using named views.
   */
  components: Record<string, RawRouteComponent>
  component?: never
  /**
   * Allow passing down params as props to the component rendered by
   * `router-view`. Should be an object with the same keys as `components` or a
   * boolean to be applied to every component.
   */
  props?: Record<string, _RouteRecordProps> | boolean
}

/**
 * Route Record that defines a redirect. Cannot have `component` or `components`
 * as it is never rendered.
 */
export interface RouteRecordRedirect extends _RouteRecordBase {
  redirect: RouteRecordRedirectOption
  component?: never
  components?: never
}

export type RouteRecordRaw =
  | RouteRecordSingleView
  | RouteRecordMultipleViews
  | RouteRecordRedirect

/**
 * Initial route location where the router is. Can be used in navigation guards
 * to differentiate the initial navigation.
 *
 * @example
 * ```js
 * import { START_LOCATION } from 'vue-router'
 *
 * router.beforeEach((to, from) => {
 *   if (from === START_LOCATION) {
 *     // initial navigation
 *   }
 * })
 * ```
 */
export const START_LOCATION_NORMALIZED: RouteLocationNormalizedLoaded = {
  path: '/',
  name: undefined,
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
  redirectedFrom: undefined,
}

// make matched non enumerable for easy printing
// NOTE: commented for tests at RouterView.spec
// Object.defineProperty(START_LOCATION_NORMALIZED, 'matched', {
//   enumerable: false,
// })

// Matcher types
// the matcher doesn't care about query and hash
export type MatcherLocationRaw =
  | LocationAsPath
  | LocationAsName
  | LocationAsRelative

// TODO: should probably be the other way around: RouteLocationNormalized extending from MatcherLocation
export interface MatcherLocation
  extends Pick<
    RouteLocation,
    'name' | 'path' | 'params' | 'matched' | 'meta'
  > {}

export interface NavigationGuardNext {
  (): void
  (error: Error): void
  (location: RouteLocationRaw): void
  (valid: boolean): void
  (cb: NavigationGuardNextCallback): void
  /**
   * Allows to detect if `next` isn't called in a resolved guard. Used
   * internally in DEV mode to emit a warning. Commented out to simplify
   * typings.
   * @internal
   */
  // _called: boolean
}

export type NavigationGuardNextCallback = (vm: ComponentPublicInstance) => any

export type NavigationGuardReturn =
  | void
  | Error
  | RouteLocationRaw
  | boolean
  | NavigationGuardNextCallback

/**
 * Navigation guard. See [Navigation
 * Guards](/guide/advanced/navigation-guards.md).
 */
export interface NavigationGuard {
  (
    // TODO: we could maybe add extra information like replace: true/false
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>
}

/**
 * {@inheritDoc NavigationGuard}
 */
export interface NavigationGuardWithThis<T> {
  (
    this: T,
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>
}

export interface NavigationHookAfter {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    // TODO: move these types to a different file
    failure?: NavigationFailure | void
  ): any
}

export * from './typeGuards'

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
