import {
  RouterHistory,
  NavigationCallback,
  parseQuery,
  normalizeLocation,
  NavigationType,
  NavigationDirection,
  HistoryLocationNormalized,
  HistoryState,
} from './common'
import { computeScrollPosition, ScrollToPosition } from '../utils/scroll'
// import consola from 'consola'

const cs = console

type PopStateListener = (this: Window, ev: PopStateEvent) => any

interface StateEntry {
  back: HistoryLocationNormalized | null
  current: HistoryLocationNormalized
  forward: HistoryLocationNormalized | null
  position: number
  replaced: boolean
  scroll: ScrollToPosition | null
}

interface PauseState {
  currentLocation: HistoryLocationNormalized
  // location we are going to after pausing
  distance: number
  // to: HistoryLocationNormalized
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
      hash: location.hash,
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
      position: window.history.length,
      scroll: computeScroll ? computeScrollPosition() : null,
    }
  }

  // private variables
  let location: HistoryLocationNormalized = createCurrentLocation(
    window.location
  )
  let historyState: StateEntry = history.state
  // build current history entry as this is a fresh navigation
  if (!historyState) {
    changeLocation(
      {
        back: null,
        current: location,
        forward: null,
        // the length is off by one, we need to decrease it
        position: history.length - 1,
        replaced: true,
        scroll: computeScrollPosition(),
      },
      '',
      location.fullPath,
      true
    )
  }
  let listeners: NavigationCallback[] = []
  let teardowns: Array<() => void> = []
  // TODO: should it be a stack? a Dict. Check if the popstate listener
  // can trigger twice
  let pauseState: PauseState | null = null
  // TODO: should it be a stack? a Dict. Check if the popstate listener
  // can trigger twice

  const popStateHandler: PopStateListener = ({
    state,
  }: {
    state: StateEntry
  }) => {
    cs.info('popstate fired', state)
    cs.info('currentState', historyState)

    // TODO: handle go(-2) and go(2) (skipping entries)

    const from = location
    const fromState = historyState
    const to = createCurrentLocation(window.location)
    location = to
    historyState = state

    if (pauseState && pauseState.currentLocation.fullPath === from.fullPath) {
      cs.info('❌ Ignored beacuse paused for', pauseState.distance)
      // reset pauseState
      if (--pauseState.distance < 1) pauseState = null
      return
    }

    const deltaFromCurrent = fromState
      ? state.position - fromState.position
      : ''
    console.log({ deltaFromCurrent })
    // call all listeners
    listeners.forEach(listener =>
      listener(location, from, {
        distance: deltaFromCurrent || 0,
        type: NavigationType.pop,
        direction: deltaFromCurrent
          ? deltaFromCurrent > 0
            ? NavigationDirection.forward
            : NavigationDirection.back
          : NavigationDirection.unknown,
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
      historyState = state
    } catch (err) {
      cs.log('[vue-router]: Error with push/replace State', err)
      // Force the navigation, this also resets the call count
      window.location[replace ? 'replace' : 'assign'](url)
    }
  }

  function pauseListeners(distance: number) {
    cs.info(`⏸ for ${distance} steps at ${location.fullPath}`)
    pauseState = {
      currentLocation: location,
      distance,
    }
  }

  const routerHistory: RouterHistory = {
    // it's overriden right after
    location,

    replace(to) {
      const normalized = normalizeLocation(to)

      // cs.info('replace', location, normalized)

      const state: StateEntry = buildState(
        historyState.back,
        normalized,
        historyState.forward,
        true
      )
      if (historyState) state.position = historyState.position
      changeLocation(
        // TODO: refactor state building
        state,
        '',
        normalized.fullPath,
        true
      )
      location = normalized
    },

    push(to, data?: HistoryState) {
      const normalized = normalizeLocation(to)

      // Add to current entry the information of where we are going
      // as well as saving the current position
      // TODO: the scroll position computation should be customizable
      const currentState = {
        ...historyState,
        forward: normalized,
        scroll: computeScrollPosition(),
      }
      changeLocation(currentState, '', currentState.current.fullPath, true)

      const state: StateEntry = {
        ...buildState(location, normalized, null),
        position: currentState.position + 1,
        ...data,
      }

      // cs.info(
      //   'push',
      //   location.fullPath,
      //   '->',
      //   normalized.fullPath,
      //   'with state',
      //   state
      // )

      changeLocation(state, '', normalized.fullPath, false)
      location = normalized
    },

    back(triggerListeners = true) {
      this.go(-1, triggerListeners)
    },

    forward(triggerListeners = true) {
      this.go(1, triggerListeners)
    },

    go(distance, triggerListeners = true) {
      if (!triggerListeners) pauseListeners(1)
      history.go(distance)
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
    },
  }

  Object.defineProperty(routerHistory, 'location', {
    get: () => location,
  })

  return routerHistory
}
