export type HistoryLocation = string
export interface HistoryURL {
  // full path (like href)
  fullPath: string
  // pathname section
  path: string
  // search string parsed
  query: Record<string, string> // TODO: handle arrays
  // hash with the #
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
  // NOTE: is it better to have strings?
  back = 'back',
  forward = 'forward',
}

export interface NavigationCallback {
  (
    to: HistoryLocation,
    from: HistoryLocation,
    info: { type: NavigationType }
  ): void
}

export type RemoveListener = () => void

const PERCENT_RE = /%/g

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
  parseURL(location: string): HistoryURL {
    let path = '',
      query: HistoryURL['query'] = {},
      searchString = '',
      hash = ''

    // Could use URL and URLSearchParams but IE 11 doesn't support it
    // TODO: move this utility to base.ts so it can be used by any history implementation
    const searchPos = location.indexOf('?')
    const hashPos = location.indexOf('#', searchPos > -1 ? searchPos : 0)
    if (searchPos > -1) {
      path = location.slice(0, searchPos)
      searchString = location.slice(
        searchPos + 1,
        hashPos > -1 ? hashPos : location.length
      )

      // TODO: properly do this in a util function
      query = searchString.split('&').reduce((query, entry) => {
        const [key, value] = entry.split('=')
        query[key] = value
        return query
      }, query)
    }

    if (hashPos > -1) {
      path = path || location.slice(0, hashPos)
      hash = location.slice(hashPos, location.length)
    }

    path = path || location

    return {
      fullPath: location,
      path,
      // TODO: transform searchString
      query,
      hash,
    }
  }

  /**
   * Stringify a URL object
   * @param location
   */
  stringifyURL(location: HistoryURL): string {
    let url = location.path
    let query = '?'
    // TODO: util function?
    for (const key in location.query) {
      if (query.length > 1) query += '&'
      // TODO: handle array
      query += `${key}=${location.query[key]}`
    }

    if (query.length > 1) url += query

    return url + location.hash
  }

  /**
   * Prepare a URI string to be passed to pushState
   * @param uri
   */
  prepareURI(uri: string) {
    // encode the % symbol so it also works on IE
    return uri.replace(PERCENT_RE, '%25')
  }

  // use regular decodeURI
  decodeURI = decodeURI

  /**
   * ensure the current location matches the external source
   * For example, in HTML5 and hash history, that would be
   * location.pathname
   * TODO: is this necessary?
   */
  abstract ensureLocation(): void
}
