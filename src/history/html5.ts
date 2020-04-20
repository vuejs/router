import {
  RouterHistory,
  NavigationCallback,
  NavigationType,
  NavigationDirection,
  HistoryLocationNormalized,
  normalizeHistoryLocation,
  HistoryState,
  RawHistoryLocation,
  ValueContainer,
  normalizeBase,
} from './common'
import { computeScrollPosition, ScrollToPosition } from '../utils/scroll'
import { warn } from 'vue'
import { stripBase } from '../utils/location'

type PopStateListener = (this: Window, ev: PopStateEvent) => any

interface StateEntry extends HistoryState {
  back: HistoryLocationNormalized | null
  current: HistoryLocationNormalized
  forward: HistoryLocationNormalized | null
  position: number
  replaced: boolean
  scroll: ScrollToPosition | null
}

/**
 * Creates a normalized history location from a window.location object
 * @param location
 */
function createCurrentLocation(
  base: string,
  location: Location
): HistoryLocationNormalized {
  const { pathname, search, hash } = location
  // allows hash based url
  const hashPos = base.indexOf('#')
  if (hashPos > -1) {
    // prepend the starting slash to hash so the url starts with /#
    let pathFromHash = hash.slice(1)
    if (pathFromHash.charAt(0) !== '/') pathFromHash = '/' + pathFromHash
    return normalizeHistoryLocation(stripBase(pathFromHash, ''))
  }
  const path = stripBase(pathname, base)
  return normalizeHistoryLocation(path + search + hash)
}

function useHistoryListeners(
  base: string,
  historyState: ValueContainer<StateEntry>,
  location: ValueContainer<HistoryLocationNormalized>,
  replace: RouterHistory['replace']
) {
  let listeners: NavigationCallback[] = []
  let teardowns: Array<() => void> = []
  // TODO: should it be a stack? a Dict. Check if the popstate listener
  // can trigger twice
  let pauseState: HistoryLocationNormalized | null = null

  const popStateHandler: PopStateListener = ({
    state,
  }: {
    state: StateEntry | null
  }) => {
    const to = createCurrentLocation(base, window.location)

    if (!state) return replace(to.fullPath)

    const from: HistoryLocationNormalized = location.value
    const fromState: StateEntry = historyState.value
    location.value = to
    historyState.value = state

    // ignore the popstate and reset the pauseState
    if (pauseState && pauseState.fullPath === from.fullPath) {
      pauseState = null
      return
    }

    const deltaFromCurrent = fromState
      ? state.position - fromState.position
      : ''
    const distance = deltaFromCurrent || 0
    // console.log({ deltaFromCurrent })
    // Here we could also revert the navigation by calling history.go(-distance)
    // this listener will have to be adapted to not trigger again and to wait for the url
    // to be updated before triggering the listeners. Some kind of validation function would also
    // need to be passed to the listeners so the navigation can be accepted
    // call all listeners
    listeners.forEach(listener => {
      listener(location.value, from, {
        distance,
        type: NavigationType.pop,
        direction: distance
          ? distance > 0
            ? NavigationDirection.forward
            : NavigationDirection.back
          : NavigationDirection.unknown,
      })
    })
  }

  function pauseListeners() {
    pauseState = location.value
  }

  function listen(callback: NavigationCallback) {
    // setup the listener and prepare teardown callbacks
    listeners.push(callback)

    const teardown = () => {
      const index = listeners.indexOf(callback)
      if (index > -1) listeners.splice(index, 1)
    }

    teardowns.push(teardown)
    return teardown
  }

  function beforeUnloadListener() {
    const { history } = window
    if (!history.state) return
    history.replaceState(
      {
        ...history.state,
        scroll: computeScrollPosition(),
      },
      ''
    )
  }

  function destroy() {
    for (const teardown of teardowns) teardown()
    teardowns = []
    window.removeEventListener('popstate', popStateHandler)
    window.removeEventListener('beforeunload', beforeUnloadListener)
  }

  // setup the listeners and prepare teardown callbacks
  window.addEventListener('popstate', popStateHandler)
  window.addEventListener('beforeunload', beforeUnloadListener)

  return {
    pauseListeners,
    listen,
    destroy,
  }
}

/**
 * Creates a state object
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

function useHistoryStateNavigation(base: string) {
  const { history } = window

  // private variables
  let location: ValueContainer<HistoryLocationNormalized> = {
    value: createCurrentLocation(base, window.location),
  }
  let historyState: ValueContainer<StateEntry> = { value: history.state }
  // build current history entry as this is a fresh navigation
  if (!historyState.value) {
    changeLocation(
      location.value,
      {
        back: null,
        current: location.value,
        forward: null,
        // the length is off by one, we need to decrease it
        position: history.length - 1,
        replaced: true,
        scroll: computeScrollPosition(),
      },
      true
    )
  }

  function changeLocation(
    to: HistoryLocationNormalized,
    state: StateEntry,
    replace: boolean
  ): void {
    const url = base + to.fullPath
    try {
      // BROWSER QUIRK
      // NOTE: Safari throws a SecurityError when calling this function 100 times in 30 seconds
      history[replace ? 'replaceState' : 'pushState'](state, '', url)
      historyState.value = state
    } catch (err) {
      warn('[vue-router]: Error with push/replace State', err)
      // Force the navigation, this also resets the call count
      window.location[replace ? 'replace' : 'assign'](url)
    }
  }

  function replace(to: RawHistoryLocation, data?: HistoryState) {
    const normalized = normalizeHistoryLocation(to)

    const state: StateEntry = {
      ...history.state,
      ...buildState(
        historyState.value.back,
        // keep back and forward entries but override current position
        normalized,
        historyState.value.forward,
        true
      ),
      ...data,
      position: historyState.value.position,
    }

    changeLocation(normalized, state, true)
    location.value = normalized
  }

  function push(to: RawHistoryLocation, data?: HistoryState) {
    const normalized = normalizeHistoryLocation(to)

    // Add to current entry the information of where we are going
    // as well as saving the current position
    // TODO: the scroll position computation should be customizable
    const currentState: StateEntry = {
      ...history.state,
      forward: normalized,
      scroll: computeScrollPosition(),
    }
    changeLocation(currentState.current, currentState, true)

    const state: StateEntry = {
      ...buildState(location.value, normalized, null),
      position: currentState.position + 1,
      ...data,
    }

    changeLocation(normalized, state, false)
    location.value = normalized
  }

  return {
    location,
    state: historyState,

    push,
    replace,
  }
}

export default function createWebHistory(base?: string): RouterHistory {
  base = normalizeBase(base)

  const historyNavigation = useHistoryStateNavigation(base)
  const historyListeners = useHistoryListeners(
    base,
    historyNavigation.state,
    historyNavigation.location,
    historyNavigation.replace
  )
  function go(distance: number, triggerListeners = true) {
    if (!triggerListeners) historyListeners.pauseListeners()
    history.go(distance)
  }
  const routerHistory: RouterHistory = {
    // it's overridden right after
    // @ts-ignore
    location: '',
    base,
    go,

    ...historyNavigation,
    ...historyListeners,
  }

  Object.defineProperty(routerHistory, 'location', {
    get: () => historyNavigation.location.value,
  })

  Object.defineProperty(routerHistory, 'state', {
    get: () => historyNavigation.state.value,
  })

  return routerHistory
}
