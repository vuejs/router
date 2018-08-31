import BaseHistory, { NavigationCallback } from './base'
import { Location } from '../types/index'

export default class HTML5History extends BaseHistory {
  history: typeof window.history
  constructor() {
    super()
    this.history = window.history
  }

  push(to: Location): void {
    // TODO resolve url
    this.history.pushState(
      {
        from: this.location,
        to,
      },
      '',
      to
    )
  }

  listen(callback: NavigationCallback): Function {
    return () => {}
  }
}
