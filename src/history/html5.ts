import consola from 'consola'
import { BaseHistory, HistoryLocationNormalized, HistoryLocation } from './base'
import { NavigationCallback, HistoryState, NavigationType } from './base'

const cs = consola.withTag('html5')

// @ts-ignore
if (process.env.NODE_ENV === 'test') cs.mockTypes(() => jest.fn())

type PopStateListener = (this: Window, ev: PopStateEvent) => any

interface StateEntry {
  back: HistoryLocationNormalized | null
  current: HistoryLocationNormalized
  forward: HistoryLocationNormalized | null
  replaced: boolean
}

// TODO: pretty useless right now except for typing
function buildState(
  back: HistoryLocationNormalized | null,
  current: HistoryLocationNormalized,
  forward: HistoryLocationNormalized | null,
  replaced: boolean = false
): StateEntry {
  return {
    back,
    current,
    forward,
    replaced,
  }
}

export class HTML5History extends BaseHistory {
  private history = window.history
  private _popStateHandler: PopStateListener
  private _listeners: NavigationCallback[] = []
  private _teardowns: Array<() => void> = []

  constructor() {
    super()
    const to = buildFullPath()
    // cs.log('created', to)
    this.history.replaceState(buildState(null, to, null), '', to.fullPath)
    this.location = to
    this._popStateHandler = this.setupPopStateListener()
  }

  // TODO: is this necessary
  ensureLocation() {}

  replace(to: HistoryLocation) {
    const normalized = this.utils.normalizeLocation(to)
    if (normalized.fullPath === this.location.fullPath) return
    cs.info('replace', this.location, normalized)
    this.history.replaceState(
      // TODO: this should be user's responsibility
      // _replacedState: this.history.state || null,
      buildState(this.history.state.back, normalized, null, true),
      '',
      normalized.fullPath
    )
    this.location = normalized
  }

  push(to: HistoryLocation, data?: HistoryState) {
    // replace current entry state to add the forward value
    const normalized = this.utils.normalizeLocation(to)
    this.history.replaceState(
      buildState(
        this.history.state.back,
        this.history.state.current,
        normalized,
        this.history.state.replaced
      ),
      ''
    )
    // TODO: compare current location to prevent navigation
    // NEW NOTE: I think it shouldn't be history responsibility to check that
    // if (to === this.location) return
    const state = {
      ...buildState(this.location, normalized, null),
      ...data,
    }
    cs.info('push', this.location, '->', normalized, 'with state', state)
    this.history.pushState(state, '', normalized.fullPath)
    this.location = normalized
  }

  listen(callback: NavigationCallback) {
    // settup the listener and prepare teardown callbacks
    this._listeners.push(callback)

    const teardown = () => {
      this._listeners.splice(this._listeners.indexOf(callback), 1)
    }

    this._teardowns.push(teardown)
    return teardown
  }

  /**
   * Remove all listeners attached to the history and cleanups the history
   * instance
   */
  destroy() {
    for (const teardown of this._teardowns) teardown()
    this._teardowns = []
    if (this._popStateHandler)
      window.removeEventListener('popstate', this._popStateHandler)
  }

  /**
   * Setups the popstate event listener. It's important to setup only
   * one to ensure the same parameters are passed to every listener
   */
  private setupPopStateListener() {
    const handler: PopStateListener = ({ state }: { state: StateEntry }) => {
      cs.info('popstate fired', {
        state,
        location: this.location,
      })
      const from = this.location
      // we have the state from the old entry, not the current one being removed
      // TODO: correctly parse pathname
      this.location = state ? state.current : buildFullPath()

      // call all listeners
      const navigationInfo = {
        type:
          state.forward && from.fullPath === state.forward.fullPath
            ? NavigationType.back
            : NavigationType.forward,
      }
      this._listeners.forEach(listener =>
        listener(this.location, from, navigationInfo)
      )
    }

    // settup the listener and prepare teardown callbacks
    window.addEventListener('popstate', handler)
    return handler
  }
}

const buildFullPath = () => {
  const { location } = window
  return {
    fullPath: location.pathname + location.search + location.hash,
    path: location.pathname,
    query: {}, // TODO: parseQuery
    hash: location.hash,
  }
}
