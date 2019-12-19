import { HistoryQuery, RawHistoryQuery } from '../history/common'
import { PathParserOptions } from '../matcher/path-parser-ranker'
// import Vue, { ComponentOptions, AsyncComponent } from 'vue'

// type Component = ComponentOptions<Vue> | typeof Vue | AsyncComponent

export type Lazy<T> = () => Promise<T>
export type Override<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type TODO = any

export type ListenerRemover = () => void

// TODO: support numbers for easier writing but cast them
export type RouteParams = Record<string, string | string[]>

export interface RouteQueryAndHash {
  query?: RawHistoryQuery
  hash?: string
}
export interface LocationAsPath {
  path: string
}

export interface LocationAsName {
  name: string
  params?: RouteParams
}

export interface LocationAsRelative {
  params?: RouteParams
}

interface RouteLocationOptions {
  replace?: boolean
}

// User level location
export type RouteLocation =
  | string
  | (RouteQueryAndHash & LocationAsPath & RouteLocationOptions)
  | (RouteQueryAndHash & LocationAsName & RouteLocationOptions)
  | (RouteQueryAndHash & LocationAsRelative & RouteLocationOptions)

// A matched record cannot be a redirection and must contain
// a normalized version of components with { default: Component } instead of `component`
export type MatchedRouteRecord = Exclude<
  RouteRecord,
  RouteRecordRedirect | RouteRecordSingleView
>

export interface RouteLocationNormalized
  extends Required<RouteQueryAndHash & LocationAsRelative & LocationAsPath> {
  fullPath: string
  query: HistoryQuery // the normalized version cannot have numbers
  // TODO: do the same for params
  name: string | void
  matched: MatchedRouteRecord[] // non-enumerable
  redirectedFrom?: RouteLocationNormalized
  meta: Record<string | number | symbol, any>
}

// interface PropsTransformer {
//   (params: RouteParams): any
// }

// export interface RouterLocation<PT extends PropsTransformer> {
//   record: RouteRecord<PT>
//   path: string
//   params: ReturnType<PT>
// }

// TODO: type this for beforeRouteUpdate and beforeRouteLeave
export interface RouteComponentInterface {
  beforeRouteEnter?: NavigationGuard<void>
  /**
   * Guard called when the router is navigating away from the current route
   * that is rendering this component.
   * @param to RouteLocation we are navigating to
   * @param from RouteLocation we are navigating from
   * @param next function to validate, cancel or modify (by redirectering) the navigation
   */
  beforeRouteLeave?: NavigationGuard<void>
  /**
   * Guard called whenever the route that renders this component has changed but
   * it is reused for the new route. This allows you to guard for changes in params,
   * the query or the hash.
   * @param to RouteLocation we are navigating to
   * @param from RouteLocation we are navigating from
   * @param next function to validate, cancel or modify (by redirectering) the navigation
   */
  beforeRouteUpdate?: NavigationGuard<void>
}

// TODO: have a real type with augmented properties
// export type RouteComponent = Component & RouteComponentInterface
type Component = {
  template?: string
  render?: Function
} & RouteComponentInterface

export type RouteComponent = Component | Lazy<Component>

// NOTE not sure the whole PropsTransformer thing can be usefull
// since in callbacks we don't know where we are coming from
// and I don't thin it's possible to filter out the route
// by any means

export interface RouteRecordCommon {
  path: string
  alias?: string | string[]
  name?: string
  beforeEnter?: NavigationGuard | NavigationGuard[]
  meta?: Record<string | number | symbol, any>
  // TODO: only allow a subset?
  options?: PathParserOptions
}

export type RouteRecordRedirectOption =
  | RouteLocation
  | ((to: RouteLocationNormalized) => RouteLocation)
export interface RouteRecordRedirect extends RouteRecordCommon {
  redirect: RouteRecordRedirectOption
}

export interface RouteRecordSingleView extends RouteRecordCommon {
  component: RouteComponent
  children?: RouteRecord[]
}

export interface RouteRecordMultipleViews extends RouteRecordCommon {
  components: Record<string, RouteComponent>
  // TODO: add tests
  children?: RouteRecord[]
}

export type RouteRecord =
  | RouteRecordSingleView
  | RouteRecordMultipleViews
  | RouteRecordRedirect

// TODO: this should probably be generate by ensureLocation
export const START_LOCATION_NORMALIZED: RouteLocationNormalized = {
  path: '/',
  name: undefined,
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
}

// make matched non enumerable for easy printing
Object.defineProperty(START_LOCATION_NORMALIZED, 'matched', {
  enumerable: false,
})

// Matcher types
// the matcher doesn't care about query and hash
export type MatcherLocation =
  | LocationAsPath
  | LocationAsName
  | LocationAsRelative

export interface MatcherLocationNormalized {
  name: RouteLocationNormalized['name']
  path: string
  // record?
  params: RouteLocationNormalized['params']
  matched: MatchedRouteRecord[]
  redirectedFrom?: MatcherLocationNormalized
  meta: RouteLocationNormalized['meta']
}

// used when the route records requires a redirection
// with a function call. The matcher isn't able to do it
// by itself, so it dispatches the information so the router
// can pick it up
export interface MatcherLocationRedirect {
  redirect: RouteRecordRedirectOption
  normalizedLocation: MatcherLocationNormalized
}

// TODO: remove any to type vm and use a generic that comes from the component
// where the navigation guard callback is defined
export interface NavigationGuardCallback {
  (): void
  (location: RouteLocation): void
  (valid: false): void
  (cb: (vm: any) => void): void
}

export interface NavigationGuard<V = void> {
  (
    this: V,
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardCallback
  ): any
}

export interface PostNavigationGuard {
  (to: RouteLocationNormalized, from: RouteLocationNormalized): any
}

export * from './type-guards'

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
