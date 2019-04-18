import * as utils from './utils'
import { ListenerRemover } from '../types'

export type HistoryQuery = Record<string, string | string[]>

export interface HistoryLocation {
  // pathname section
  path: string
  // search string parsed
  query?: HistoryQuery
  // hash with the #
  hash?: string
}
export interface HistoryLocationNormalized extends Required<HistoryLocation> {
  // full path (like href)
  fullPath: string
}

// pushState clones the state passed and do not accept everything
// it doesn't accept symbols, nor functions as values. It also ignores Symbols as keys
type HistoryStateValue =
  | string
  | number
  | boolean
  | null
  | HistoryState
  | HistoryStateArray
export interface HistoryState {
  [x: number]: HistoryStateValue
  [x: string]: HistoryStateValue
}
interface HistoryStateArray extends Array<HistoryStateValue> {}
// export type HistoryState = Record<string | number, string | number | boolean | undefined | null |

export const START: HistoryLocationNormalized = {
  fullPath: '/',
  path: '/',
  query: {},
  hash: '',
}

export enum NavigationType {
  // NOTE: is it better to have strings?
  back = 'back',
  forward = 'forward',
}

export interface NavigationCallback {
  (
    to: HistoryLocationNormalized,
    from: HistoryLocationNormalized,
    info: { type: NavigationType }
  ): void
}

export abstract class BaseHistory {
  // previousState: object
  location: HistoryLocationNormalized = START
  base: string = ''
  utils = utils

  /**
   * Sync source with a different location.
   * Adds an entry to the history
   * @param to URL to go to
   */
  abstract push(to: HistoryLocation, data?: any): void

  /**
   * Syncs source with a different location
   * Replaces current entry in the history
   * @param to URL to go to
   */
  abstract replace(to: HistoryLocation): void

  /**
   * Notifies back whenever the location changes due to user interactions
   * outside of the applicaiton. For example, going back/forward on a
   * web browser
   * @param callback callback to be called whenever the route changes
   * @returns
   */
  abstract listen(callback: NavigationCallback): ListenerRemover

  /**
   * ensure the current location matches the external source
   * For example, in HTML5 and hash history, that would be
   * location.pathname
   * TODO: is this necessary?
   */
  abstract ensureLocation(): void
}
