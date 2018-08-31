import { START, Location } from '../types/index'
export interface NavigationCallback {
  (location: string): void
}

export default abstract class BaseHistory {
  // previousState: object
  location: Location
  abstract push(to: Location): void
  abstract listen(callback: NavigationCallback): Function

  constructor() {
    this.location = START
  }
}
