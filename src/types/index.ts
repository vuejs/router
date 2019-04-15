import { HistoryURL } from '../history/base'

type TODO = any

export type RouteParams = Record<string, string | string[]>
export type RouteQuery = Record<string, string | null>

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

type RouteObjectLocation =
  | {
      path: string
      query?: RouteQuery
      hash?: string
    }
  | {
      name: string
      params?: RouteParams
      query?: RouteQuery
      hash?: string
    }
  | {
      params?: RouteParams
      query?: RouteQuery
      hash?: string
    }

// TODO: location should be an object
export type MatcherLocation = HistoryURL | RouteObjectLocation

export type RouterLocation = string | RouteObjectLocation

export interface RouterLocationNormalized {
  path: string
  fullPath: string
  name?: string
  params: RouteParams
  query: RouteQuery
  hash: string
}

export const START_RECORD: RouteRecord = {
  path: '/',
  // @ts-ignore
  component: { render: h => h() },
}

export const START_LOCATION_NORMALIZED: RouterLocationNormalized = {
  path: '/',
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
}
