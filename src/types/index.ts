type TODO = any

export type ParamsType = Record<string, string | string[]>

// interface PropsTransformer {
//   (params: ParamsType): any
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

// TODO: location should be an object
export type RouterLocation =
  | string
  | {
      path: string
    }
  | {
      name: string
      params?: ParamsType
    }
  | {
      params: ParamsType
    }

export interface RouterLocationNormalized {
  path: string
  name?: string
  params: ParamsType
  query: TODO
  hash: TODO
}

export type HistoryLocation = string

// pushState clones the state passed and do not accept everything
// it doesn't accept symbols, nor functions. It also ignores Symbols as keys
type HistoryStateValue =
  | string
  | number
  | boolean
  | HistoryState
  | HistoryStateArray
export interface HistoryState {
  [x: number]: HistoryStateValue
  [x: string]: HistoryStateValue
}
interface HistoryStateArray extends Array<HistoryStateValue> {}
// export type HistoryState = Record<string | number, string | number | boolean | undefined | null |

export const START: HistoryLocation = '/'
export const START_RECORD: RouteRecord = {
  path: '/',
  // @ts-ignore
  component: { render: h => h() },
}

export enum NavigationType {
  back,
  forward,
}

export interface NavigationCallback {
  (
    to: HistoryLocation,
    from: HistoryLocation,
    info: { type: NavigationType }
  ): void
}

export type RemoveListener = () => void
