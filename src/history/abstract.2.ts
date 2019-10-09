// import consola from 'consola'
import {
  RouterHistory,
  NavigationCallback,
  START,
  normalizeLocation,
  HistoryLocationNormalized,
  HistoryState,
  NavigationType,
  NavigationDirection,
} from './common'

// TODO: implement navigation direction in listeners

// const cs = console
// const cs = consola.withTag('abstract')

export default function createAbstractHistory(): RouterHistory {
  let listeners: NavigationCallback[] = []
  // TODO: make sure this is right as the first location is nowhere so maybe this should be empty instead
  let queue: HistoryLocationNormalized[] = [START]
  let position: number = 0

  function setLocation(location: HistoryLocationNormalized) {
    position++
    if (position === queue.length) {
      // we are at the end, we can simply append a new entry
      queue.push(location)
    } else {
      // we are in the middle, we remove everything from here in the queue
      queue.splice(position)
      queue.push(location)
    }
  }

  function triggerListeners(
    to: HistoryLocationNormalized,
    from: HistoryLocationNormalized,
    { direction }: { direction: NavigationDirection }
  ): void {
    // TODO: proper type
    const info: Parameters<NavigationCallback>[2] = {
      direction,
      type: NavigationType.pop,
    }
    for (let callback of listeners) {
      callback(to, from, info)
    }
  }

  const routerHistory: RouterHistory = {
    // rewritten by Object.defineProperty
    location: START,

    replace(to) {
      const toNormalized = normalizeLocation(to)
      // remove current entry and decrement position
      queue.splice(position--, 1)
      setLocation(toNormalized)
    },

    push(to, data?: HistoryState) {
      setLocation(normalizeLocation(to))
    },

    listen(callback) {
      listeners.push(callback)
      return () => {
        const index = listeners.indexOf(callback)
        if (index > -1) listeners.splice(index, 1)
      }
    },
    destroy() {
      listeners = []
    },

    back(shouldTrigger = true) {
      const from = this.location
      if (position > 0) position--
      if (shouldTrigger) {
        triggerListeners(this.location, from, {
          direction: NavigationDirection.back,
        })
      }
    },

    forward(shouldTrigger: boolean = true) {
      const from = this.location
      if (position < queue.length - 1) position++
      if (shouldTrigger) {
        triggerListeners(this.location, from, {
          direction: NavigationDirection.forward,
        })
      }
    },
  }

  Object.defineProperty(routerHistory, 'location', {
    get: () => queue[position],
  })

  return routerHistory
}
