// import consola from 'consola'
import { BaseHistory, HistoryLocation, HistoryLocationNormalized } from './base'
import { NavigationCallback, HistoryState, START } from './base'

// const cs = consola.withTag('abstract')

export class AbstractHistory extends BaseHistory {
  // private _listeners: NavigationCallback[] = []
  private teardowns: Array<() => void> = []
  public queue: HistoryLocationNormalized[] = [START]
  public position: number = 0

  constructor() {
    super()
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

  back() {
    if (this.position > 0) this.position--
  }

  forward() {
    if (this.position < this.queue.length - 1) this.position++
  }

  destroy() {
    for (const teardown of this.teardowns) teardown()
    this.teardowns = []
  }
}
