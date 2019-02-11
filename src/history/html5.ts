import BaseHistory from './base'
import { HistoryLocation, NavigationCallback } from '../types/index'

export default class HTML5History extends BaseHistory {
  private history = window.history
  private _popStateListener:
    | null
    | ((this: Window, ev: PopStateEvent) => any) = null

  constructor() {
    super()
  }

  ensureLocation() {
    const to = window.location.pathname
    this.replace(to)
  }

  replace(to: HistoryLocation) {
    if (to === this.location) return
    console.log('replace', this.location, to)
    this.history.replaceState(
      {
        replacedState: this.history.state || {},
        from: this.location,
        to,
      },
      '',
      to
    )
    this.location = to
  }

  push(to: HistoryLocation) {
    // TODO: resolve url
    // TODO: compare current location to prevent navigation
    if (to === this.location) return
    const state = {
      from: this.location,
      to,
    }
    console.log('push', this.location, to)
    this.history.pushState(state, '', to)
    this.location = to
  }

  listen(callback: NavigationCallback) {
    this._popStateListener = ({ state }) => {
      const from = this.location
      // we have the state from the old entry, not the current one being removed
      // TODO: correctly parse pathname
      this.location = state ? state.to : window.location.pathname
      callback(this.location, from)
    }
    window.addEventListener('popstate', this._popStateListener)

    return () => {
      window.removeEventListener('popstate', this._popStateListener!)
    }
  }
}
