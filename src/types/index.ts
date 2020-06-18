import { LocationQuery, LocationQueryRaw } from '../query'
import { PathParserOptions } from '../matcher'
import { Ref, ComputedRef, Component } from 'vue'
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

export interface RouteQueryAndHash {
  query?: LocationQueryRaw
  hash?: string
}
export interface LocationAsPath {
  path: string
}

export interface LocationAsNameRaw {
  name: RouteRecordName
  params?: RouteParamsRaw
}

export interface LocationAsName {
  name: RouteRecordName
  params?: RouteParams
}

export interface LocationAsRelativeRaw {
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
  | (RouteQueryAndHash & LocationAsNameRaw & RouteLocationOptions)
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
  path: string
  fullPath: string
  query: LocationQuery
  hash: string
  name: RouteRecordName | null | undefined
  params: RouteParams
  redirectedFrom: RouteLocation | undefined
  meta: Record<string | number | symbol, any>
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
 */
export interface _RouteRecordBase extends PathParserOptions {
  /**
   * Path of the record. Should start with `/` unless the record is the child of
   * another record.
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
  meta?: Record<string | number | symbol, any>
}

export type RouteRecordRedirectOption =
  | RouteLocationRaw
  | ((to: RouteLocation) => RouteLocationRaw)

export interface RouteRecordSingleView extends _RouteRecordBase {
  /**
   * Component to display when the URL matches this route.
   */
  component: RawRouteComponent
  /**
   * Allow passing down params as props to the component rendered by `router-view`.
   */
  props?: _RouteRecordProps
}

export interface RouteRecordMultipleViews extends _RouteRecordBase {
  /**
   * Components to display when the URL matches this route. Allow using named views.
   */
  components: Record<string, RawRouteComponent>
  /**
   * Allow passing down params as props to the component rendered by
   * `router-view`. Should be an object with the same keys as `components` or a
   * boolean to be applied to every component.
   */
  props?: Record<string, _RouteRecordProps> | boolean
}

export interface RouteRecordRedirect extends _RouteRecordBase {
  /**
   * @inheritdoc
   */
  redirect: RouteRecordRedirectOption
  component?: never
  components?: never
  children?: never
}

export interface RouteRecordRedirectWithChildren extends _RouteRecordBase {
  component?: never
  children: Exclude<_RouteRecordBase['children'], undefined>
}

export type RouteRecordRaw =
  | RouteRecordSingleView
  | RouteRecordMultipleViews
  | RouteRecordRedirect

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
}

export type NavigationGuardNextCallback = (vm: any) => any

export interface NavigationGuard {
  (
    // TODO: we could maybe add extra information like replace: true/false
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): any
}

export interface NavigationGuardWithThis<T> {
  (
    this: T,
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): any
}

export interface PostNavigationGuard {
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
