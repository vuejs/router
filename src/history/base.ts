export type HistoryLocation = string
export interface HistoryURL {
  path: string
  search: Record<string, string>
  hash: string
}

// pushState clones the state passed and do not accept everything
// it doesn't accept symbols, nor functions. It also ignores Symbols as keys
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

export const START: HistoryLocation = '/'

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

export abstract class BaseHistory {
  // previousState: object
  location: HistoryLocation = START
  base: string = ''

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
  abstract listen(callback: NavigationCallback): RemoveListener

  /**
   * Transforms a URL into an object
   * @param location location to normalize
   * @param currentLocation current location, to reuse params and location
   */
  abstract parseURL(location: HistoryLocation): HistoryURL

  /**
   * ensure the current location matches the external source
   * For example, in HTML5 and hash history, that would be
   * location.pathname
   * TODO: is this necessary?
   */
  abstract ensureLocation(): void
}
