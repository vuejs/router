// import consola from 'consola'
import { BaseHistory, HistoryLocation, HistoryLocationNormalized } from './base'
import { NavigationCallback, HistoryState, START } from './base'

// const cs = consola.withTag('abstract')

export class AbstractHistory extends BaseHistory {
  // private _listeners: NavigationCallback[] = []
  private teardowns: Array<() => void> = []
  public queue: HistoryLocationNormalized[] = [START]

  constructor() {
    super()
    debugger
  }

  // TODO: is this necessary
  ensureLocation() {}

  replace(to: HistoryLocation) {}

  push(to: HistoryLocation, data?: HistoryState) {
    const toNormalized = this.utils.normalizeLocation(to)
    this.location = toNormalized
  }

  listen(callback: NavigationCallback) {
    return () => {}
  }

  get location() {
    console.log('read location', this.queue)
    return this.queue[this.queue.length - 1]
  }

  set location(location: HistoryLocationNormalized) {
    // super() call tries to push before the array is created
    console.log('set location', location)
    if (!this.queue) this.queue = []
    // TODO: handle in the middle
    this.queue.push(location)
  }

  back() {
    this.queue.pop()
  }

  destroy() {
    for (const teardown of this.teardowns) teardown()
    this.teardowns = []
  }

  back() {}
}
