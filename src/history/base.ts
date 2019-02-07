import { START, HistoryLocation } from '../types/index'
export interface NavigationCallback {
  (to: HistoryLocation, from: HistoryLocation): void
}

export default abstract class BaseHistory {
  // previousState: object
  location: HistoryLocation
  abstract push(to: HistoryLocation): void
  abstract replace(to: HistoryLocation): void
  abstract listen(callback: NavigationCallback): Function
  /**
   * ensure the current location using the external source
   * for example, in HTML5 and hash history, that would be
   * location.pathname
   */
  abstract ensureLocation(): void

  constructor() {
    this.location = START
  }
}
