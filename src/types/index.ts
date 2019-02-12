type TODO = any

export type ParamsType = Record<string, string | string[]>

// interface PropsTransformer {
//   (params: ParamsType): any
// }

// export interface Location<PT extends PropsTransformer> {
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

// TODO location should be an object
export type Location =
  | string
  | {
      path: string
    }
  | {
      name: string
      params?: Record<string, string>
    }

export type HistoryLocation = string

export const START: HistoryLocation = '/'

export interface NavigationCallback {
  (to: HistoryLocation, from: HistoryLocation): void
}

export type RemoveListener = () => void
