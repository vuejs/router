import {
  RouterHistory,
  NavigationCallback,
  parseQuery,
  normalizeLocation,
  stripBase,
  NavigationType,
  NavigationDirection,
  HistoryLocationNormalized,
  HistoryState,
  parseURL,
  RawHistoryLocation,
  ValueContainer,
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

/**
 * Creates a noramlized history location from a window.location object
 * TODO: encoding is not handled like this
 * @param location
 */
function createCurrentLocation(
  base: string,
  location: Location
): HistoryLocationNormalized {
  const { pathname, search, hash } = location
  // allows hash based url
  if (base.indexOf('#') > -1) {
    // prepend the starting slash to hash so the url starts with /#
    return parseURL(stripBase('/' + hash, base))
  }
  const path = stripBase(pathname, base)
  return {
    fullPath: path + search + hash,
    path,
    query: parseQuery(search),
    hash: hash,
  }
}

function useHistoryListeners(
  base: string,
  historyState: ValueContainer<StateEntry>,
  location: ValueContainer<HistoryLocationNormalized>
) {
  let listeners: NavigationCallback[] = []
  let teardowns: Array<() => void> = []
  // TODO: should it be a stack? a Dict. Check if the popstate listener
  // can trigger twice
  let pauseState: HistoryLocationNormalized | null = null

  const popStateHandler: PopStateListener = ({
    state,
  }: {
    state: StateEntry
  }) => {
    cs.info('popstate fired', state)
    cs.info('currentState', historyState)

    const from: HistoryLocationNormalized = location.value
    const fromState: StateEntry = historyState.value
    const to = createCurrentLocation(base, window.location)
    location.value = to
    historyState.value = state

    if (pauseState && pauseState.fullPath === from.fullPath) {
      cs.info('❌ Ignored beacuse paused for', pauseState.fullPath)
      // reset pauseState
      pauseState = null
      return
    }

    const deltaFromCurrent = fromState
      ? state.position - fromState.position
      : ''
    console.log({ deltaFromCurrent })
    // call all listeners
    listeners.forEach(listener =>
      listener(location.value, from, {
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

  function pauseListeners() {
    cs.info(`⏸ for ${location.value.fullPath}`)
    pauseState = location.value
  }

  function listen(callback: NavigationCallback) {
    // settup the listener and prepare teardown callbacks
    listeners.push(callback)

    const teardown = () => {
      const index = listeners.indexOf(callback)
      if (index > -1) listeners.splice(index, 1)
    }

    teardowns.push(teardown)
    return teardown
  }

  function destroy() {
    for (const teardown of teardowns) teardown()
    teardowns = []
    window.removeEventListener('popstate', popStateHandler)
  }

  // settup the listener and prepare teardown callbacks
  window.addEventListener('popstate', popStateHandler)

  return {
    pauseListeners,
    listen,
    destroy,
  }
}

function useHistoryStateNavigation(base: string) {
  const { history } = window

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

  // private variables
  let location: ValueContainer<HistoryLocationNormalized> = {
    value: createCurrentLocation(base, window.location),
  }
  let historyState: ValueContainer<StateEntry> = { value: history.state }
  // build current history entry as this is a fresh navigation
  if (!historyState.value) {
    changeLocation(
      {
        back: null,
        current: location.value,
        forward: null,
        // the length is off by one, we need to decrease it
        position: history.length - 1,
        replaced: true,
        scroll: computeScrollPosition(),
      },
      '',
      location.value.fullPath,
      true
    )
  }

  function changeLocation(
    state: StateEntry,
    title: string,
    fullPath: string,
    replace: boolean
  ): void {
    const url = base + fullPath
    try {
      // BROWSER QUIRK
      // NOTE: Safari throws a SecurityError when calling this function 100 times in 30 seconds
      const newState: StateEntry = replace
        ? { ...historyState.value, ...state }
        : state
      history[replace ? 'replaceState' : 'pushState'](newState, title, url)
      historyState.value = state
    } catch (err) {
      cs.log('[vue-router]: Error with push/replace State', err)
      // Force the navigation, this also resets the call count
      window.location[replace ? 'replace' : 'assign'](url)
    }
  }

  function replace(to: RawHistoryLocation) {
    const normalized = normalizeLocation(to)

    // cs.info('replace', location, normalized)

    const state: StateEntry = buildState(
      historyState.value.back,
      normalized,
      historyState.value.forward,
      true
    )
    if (historyState) state.position = historyState.value.position
    changeLocation(
      // TODO: refactor state building
      state,
      '',
      normalized.fullPath,
      true
    )
    location.value = normalized
  }

  function push(to: RawHistoryLocation, data?: HistoryState) {
    const normalized = normalizeLocation(to)

    // Add to current entry the information of where we are going
    // as well as saving the current position
    // TODO: the scroll position computation should be customizable
    const currentState: StateEntry = {
      ...historyState.value,
      forward: normalized,
      scroll: computeScrollPosition(),
    }
    changeLocation(currentState, '', currentState.current.fullPath, true)

    const state: StateEntry = {
      ...buildState(location.value, normalized, null),
      position: currentState.position + 1,
      ...data,
    }

    changeLocation(state, '', normalized.fullPath, false)
    location.value = normalized
  }

  return {
    location,
    state: historyState,

    push,
    replace,
  }
}

export default function createHistory(base: string = ''): RouterHistory {
  if ('scrollRestoration' in window.history) {
    history.scrollRestoration = 'manual'
  }

  const historyNavigation = useHistoryStateNavigation(base)
  const historyListeners = useHistoryListeners(
    base,
    historyNavigation.state,
    historyNavigation.location
  )
  function back(triggerListeners = true) {
    go(-1, triggerListeners)
  }
  function forward(triggerListeners = true) {
    go(1, triggerListeners)
  }
  function go(distance: number, triggerListeners = true) {
    if (!triggerListeners) historyListeners.pauseListeners()
    history.go(distance)
  }
  const routerHistory: RouterHistory = {
    // it's overriden right after
    // @ts-ignore
    location: historyNavigation.location.value,
    base,
    back,
    forward,
    go,

    ...historyNavigation,
    ...historyListeners,
  }

  Object.defineProperty(routerHistory, 'location', {
    get: () => historyNavigation.location.value,
  })

  return routerHistory
}
