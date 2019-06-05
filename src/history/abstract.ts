// import consola from 'consola'
import {
  BaseHistory,
  HistoryLocation,
  HistoryLocationNormalized,
  NavigationDirection,
} from './base'
import { NavigationCallback, HistoryState, START } from './base'

// const cs = consola.withTag('abstract')

export class AbstractHistory extends BaseHistory {
  private listeners: NavigationCallback[] = []
  public queue: HistoryLocationNormalized[] = [START]
  public position: number = 0

  constructor() {
    super()
  }

  // TODO: is this necessary
  ensureLocation() {}

  replace(to: HistoryLocation) {
    const toNormalized = this.utils.normalizeLocation(to)
    // remove current entry and decrement position
    this.queue.splice(this.position--, 1)
    this.location = toNormalized
  }

  push(to: HistoryLocation, data?: HistoryState) {
    const toNormalized = this.utils.normalizeLocation(to)
    this.location = toNormalized
  }

  listen(callback: NavigationCallback) {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  get location() {
    return this.queue[this.position]
  }

  set location(location: HistoryLocationNormalized) {
    // super() call tries to push before the array is created
    if (!this.queue) this.queue = []
    // move the queue cursor forward
    this.position++
    if (this.position === this.queue.length) {
      // we are at the end, we can simply append a new entry
      this.queue.push(location)
    } else {
      // we are in the middle, we remove everything from here in the queue
      this.queue.splice(this.position)
      this.queue.push(location)
    }
  }

  back(triggerListeners: boolean = true) {
    const from = this.location
    if (this.position > 0) this.position--
    if (triggerListeners) {
      this.triggerListeners(this.location, from, {
        direction: NavigationDirection.back,
      })
    }
  }

  forward(triggerListeners: boolean = true) {
    const from = this.location
    if (this.position < this.queue.length - 1) this.position++
    if (triggerListeners) {
      this.triggerListeners(this.location, from, {
        direction: NavigationDirection.forward,
      })
    }
  }

  destroy() {
    this.listeners = []
  }

  private triggerListeners(
    to: HistoryLocationNormalized,
    from: HistoryLocationNormalized,
    { direction }: { direction: NavigationDirection }
  ): void {
    const info = { direction }
    for (let callback of this.listeners) {
      callback(to, from, info)
    }
  }
}
