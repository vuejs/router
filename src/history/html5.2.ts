import {
  RouterHistory,
  NavigationCallback,
  parseQuery,
  normalizeLocation,
  NavigationType
} from './common'
import { HistoryLocationNormalized, HistoryState } from './base'
import { computeScrollPosition, ScrollToPosition } from '../utils/scroll'
// import consola from 'consola'

const cs = console

type PopStateListener = (this: Window, ev: PopStateEvent) => any

interface StateEntry {
  back: HistoryLocationNormalized | null
  current: HistoryLocationNormalized
  forward: HistoryLocationNormalized | null
  replaced: boolean
  scroll: ScrollToPosition | null
}

export default function createHistory(): RouterHistory {
  const { history } = window

  /**
   * Creates a noramlized history location from a window.location object
   * TODO: encoding is not handled like this
   * @param location
   */
  function createCurrentLocation(
    location: Location
  ): HistoryLocationNormalized {
    return {
      fullPath: location.pathname + location.search + location.hash,
      path: location.pathname,
      query: parseQuery(location.search),
      hash: location.hash
    }
  }

  /**
   * Creates a state objec
   */
  function buildState(
    back: HistoryLocationNormalized | null,
    current: HistoryLocationNormalized,
    forward: HistoryLocationNormalized | null,
    replaced: boolean = false,
    computeScroll: boolean = false
  ): StateEntry {
    return {
      back,
      current,
      forward,
      replaced,
      scroll: computeScroll ? computeScrollPosition() : null
    }
  }

  // private state of History
  let location: HistoryLocationNormalized = normalizeLocation(
    window.location.href
  )
  let listeners: NavigationCallback[] = []
  let teardowns: Array<() => void> = []
  // TODO: should it be a stack? a Dict. Check if the popstate listener
  // can trigger twice

  const popStateHandler: PopStateListener = ({
    state
  }: {
    state: StateEntry
  }) => {
    cs.info('popstate fired', { state, location })

    // TODO: handle go(-2) and go(2) (skipping entries)

    const from = location
    location = createCurrentLocation(window.location)

    // call all listeners
    listeners.forEach(listener =>
      listener(location, from, {
        type: NavigationType.pop
      })
    )
  }

  // settup the listener and prepare teardown callbacks
  window.addEventListener('popstate', popStateHandler)

  function changeLocation(
    state: StateEntry,
    title: string,
    url: string,
    replace: boolean
  ): void {
    try {
      // BROWSER QUIRK
      // NOTE: Safari throws a SecurityError when calling this function 100 times in 30 seconds
      history[replace ? 'replaceState' : 'pushState'](state, title, url)
    } catch (err) {
      cs.log('[vue-router]: Error with push/replace State', err)
      // Force the navigation, this also resets the call count
      window.location[replace ? 'replace' : 'assign'](url)
    }
  }

  return {
    location,

    replace(to) {
      const normalized = normalizeLocation(to)

      cs.info('replace', location, normalized)

      changeLocation(
        buildState(history.state.back, normalized, null, true),
        '',
        normalized.fullPath,
        true
      )
      location = normalized
    },

    push(to, data?: HistoryState) {
      const normalized = normalizeLocation(to)

      // Add to current entry the information of where we are going
      history.state.forward = normalized

      const state = {
        ...buildState(location, normalized, null),
        ...data
      }

      cs.info('push', location, '->', normalized, 'with state', state)

      changeLocation(state, '', normalized.fullPath, false)
      location = normalized
    },

    listen(callback) {
      // settup the listener and prepare teardown callbacks
      listeners.push(callback)

      const teardown = () => {
        const index = listeners.indexOf(callback)
        if (index > -1) listeners.splice(index, 1)
      }

      teardowns.push(teardown)
      return teardown
    },

    destroy() {
      for (const teardown of teardowns) teardown()
      teardowns = []
      window.removeEventListener('popstate', popStateHandler)
    }
  }
}
