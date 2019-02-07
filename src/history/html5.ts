import BaseHistory, { NavigationCallback } from './base'
import { HistoryLocation } from '../types/index'

export default class HTML5History extends BaseHistory {
  private history = window.history
  constructor() {
    super()
  }

  ensureLocation() {
    const to = window.location.pathname
    this.replace(to)
  }

  replace(to: HistoryLocation) {
    if (to === this.location) return
    this.history.replaceState(
      {
        ...(this.history.state || {}),
        to,
      },
      '',
      to
    )
    this.location = to
  }

  push(to: HistoryLocation) {
    // TODO resolve url
    // TODO compare current location to prevent navigation
    if (to === this.location) return
    const state = {
      from: this.location,
      to,
    }
    console.log('push', state)
    this.history.pushState(state, '', to)
    this.location = to
  }

  listen(callback: NavigationCallback): Function {
    window.addEventListener('popstate', ({ state }) => {
      const from = this.location
      // we have the state from the old entry, not the current one being removed
      // TODO correctly parse pathname
      this.location = state ? state.to : window.location.pathname
      callback(this.location, from)
    })

    return () => {}
  }
}
