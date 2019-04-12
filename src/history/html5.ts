import consola from 'consola'
import { BaseHistory } from './base'
import {
  HistoryLocation,
  NavigationCallback,
  HistoryState,
  NavigationType,
} from './base'

const cs = consola.withTag('html5')

type PopStateListener = (this: Window, ev: PopStateEvent) => any

interface StateEntry {
  back: HistoryLocation | null
  current: HistoryLocation
  forward: HistoryLocation | null
  replaced: boolean
}

// TODO: pretty useless right now except for typing
function buildState(
  back: HistoryLocation | null,
  current: HistoryLocation,
  forward: HistoryLocation | null,
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
  location: HistoryLocation
  private _popStateHandler: PopStateListener
  private _listeners: NavigationCallback[] = []
  private _teardowns: Array<() => void> = []

  constructor() {
    super()
    const to = buildFullPath()
    cs.log('created', to)
    this.history.replaceState(buildState(null, to, null), '', to)
    this.location = to
    this._popStateHandler = this.setupPopStateListener()
  }

  // TODO: is this necessary
  ensureLocation() {}

  replace(to: HistoryLocation) {
    // TODO: standarize URL
    if (to === this.location) return
    cs.info('replace', this.location, to)
    this.history.replaceState(
      // TODO: this should be user's responsibility
      // _replacedState: this.history.state || null,
      buildState(this.history.state.back, to, null, true),
      '',
      to
    )
    this.location = to
  }

  push(to: HistoryLocation, data?: HistoryState) {
    // replace current entry state to add the forward value
    this.history.replaceState(
      buildState(
        this.history.state.back,
        this.history.state.current,
        to,
        this.history.state.replaced
      ),
      ''
    )
    // TODO: compare current location to prevent navigation
    // NEW NOTE: I think it shouldn't be history responsibility to check that
    // if (to === this.location) return
    const state = {
      ...buildState(this.location, to, null),
      ...data,
    }
    cs.info('push', this.location, '->', to, 'with state', state)
    this.history.pushState(state, '', to)
    this.location = to
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
          from === state.forward ? NavigationType.back : NavigationType.forward,
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

const buildFullPath = () =>
  window.location.pathname + window.location.search + window.location.hash
