type TODO = any

// TODO: support numbers for easier writing but cast them
export type RouteParams = Record<string, string | string[]>
export type RouteQuery = Record<string, string | string[] | null>

export interface RouteQueryAndHash {
  query?: RouteQuery
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

// User level location
export type RouteLocation =
  | string
  | RouteQueryAndHash & LocationAsPath
  | RouteQueryAndHash & LocationAsName
  | RouteQueryAndHash & LocationAsRelative

// the matcher doesn't care about query and hash
export type MatcherLocation =
  | LocationAsPath
  | LocationAsName
  | LocationAsRelative

// exposed to the user in a very consistant way
export interface RouteLocationNormalized {
  path: string
  fullPath: string
  name: string | void
  params: RouteParams
  query: RouteQuery
  hash: string
}

// interface PropsTransformer {
//   (params: RouteParams): any
// }

// export interface RouterLocation<PT extends PropsTransformer> {
//   record: RouteRecord<PT>
//   path: string
//   params: ReturnType<PT>
// }

// NOTE not sure the whole PropsTransformer thing can be usefull
// since in callbacks we don't know where we are coming from
// and I don't thin it's possible to filter out the route
// by any means
export interface RouteRecord {
  path: string // | RegExp
  component: TODO
  name?: string
  // props: PT
}

export const START_RECORD: RouteRecord = {
  path: '/',
  // @ts-ignore
  component: { render: h => h() },
}

export const START_LOCATION_NORMALIZED: RouteLocationNormalized = {
  path: '/',
  name: undefined,
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
}

// Matcher types
// TODO: can probably have types with no record, path and others
// should be an & type
export interface MatcherLocationNormalized {
  name: RouteLocationNormalized['name']
  path: string
  // record?
  params: RouteLocationNormalized['params']
}
