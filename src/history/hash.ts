import consola from '../consola'
import { BaseHistory, HistoryLocationNormalized, HistoryLocation } from './base'
import { NavigationCallback, HistoryState, NavigationDirection } from './base'

const cs = consola.withTag('hash')

// TODO: implement the mock instead
/* istanbul ignore next */
// @ts-ignore otherwise fails after rollup replacement plugin
if (process.env.NODE_ENV === 'test') cs.mockTypes(() => jest.fn())

type HashChangeHandler = (this: Window, ev: HashChangeEvent) => any

/**
 * TODO: currently, we cannot prevent a hashchange, we could pass a callback to restore previous navigation on the listener. But we will face the same problems as with HTML5: go(-n) can leads to unexpected directions. We could save a copy of the history and the state, pretty much polyfilling the state stack
 */

interface PauseState {
  currentLocation: HistoryLocationNormalized
  // location we are going to after pausing
  to: HistoryLocationNormalized
}

export class HashHistory extends BaseHistory {
  // private history = window.history
  private _hashChangeHandler: HashChangeHandler
  private _listeners: NavigationCallback[] = []
  private _teardowns: Array<() => void> = []

  // TODO: should it be a stack? a Dict. Check if the popstate listener
  // can trigger twice
  private pauseState: PauseState | null = null

  constructor() {
    super()
    // const to = this.createCurrentLocation()
    // replace current url to ensure leading slash
    // this.history.replaceState(buildState(null, to, null), '', to.fullPath)
    // we cannot use window.location.hash because some browsers
    // predecode it
    this.location = this.utils.normalizeLocation(
      getFullPath(window.location.href)
    )
    this._hashChangeHandler = this.setupHashListener()
  }

  // TODO: is this necessary
  ensureLocation() {}

  replace(location: HistoryLocation) {
    const to = this.utils.normalizeLocation(location)
    // this.pauseListeners(to)
    const hashIndex = window.location.href.indexOf('#')
    // set it before to make sure we can skip the listener with a simple check
    this.location = to
    window.location.replace(
      window.location.href.slice(0, hashIndex < 0 ? 0 : hashIndex) +
        '#' +
        to.fullPath
    )
  }

  push(location: HistoryLocation, data?: HistoryState) {
    const to = this.utils.normalizeLocation(location)
    // set it before to make sure we can skip the listener with a simple check
    this.location = to
    window.location.hash = '#' + to.fullPath
  }

  back(triggerListeners: boolean = true) {
    // TODO: check if we can go back
    // const previvousLocation = this.history.state
    //   .back as HistoryLocationNormalized
    if (!triggerListeners) this.pauseListeners(this.location)
    window.history.back()
  }

  forward(triggerListeners: boolean = true) {}

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
    if (this._hashChangeHandler)
      window.removeEventListener('hashchange', this._hashChangeHandler)
  }

  /**
   * Setups the popstate event listener. It's important to setup only
   * one to ensure the same parameters are passed to every listener
   */
  private setupHashListener() {
    const handler: HashChangeHandler = ({ oldURL, newURL }) => {
      // TODO: assert oldURL === this.location.fullPath
      cs.info('hashchange fired', {
        location: this.location.fullPath,
        oldURL,
        newURL,
      })

      // TODO: handle go(-2) and go(2) (skipping entries)

      const from = this.location

      const targetTo = getFullPath(newURL)

      if (from.fullPath === targetTo) {
        cs.info('ignored because internal navigation')
        return
      }
      // we have the state from the old entry, not the current one being removed
      // TODO: correctly parse pathname
      // TODO: ensure newURL value is consistent
      // handle encoding
      const to = this.utils.normalizeLocation(targetTo)
      this.location = to

      if (
        this.pauseState &&
        this.pauseState.to &&
        this.pauseState.to.fullPath === to.fullPath
      ) {
        cs.info('Ignored beacuse paused')
        // reset pauseState
        this.pauseState = null
        return
      }

      // call all listeners
      const navigationInfo = {
        // TODO: should we do an unknown direction?
        direction: NavigationDirection.forward,
      }
      this._listeners.forEach(listener =>
        listener(this.location, from, navigationInfo)
      )
    }

    // settup the listener and prepare teardown callbacks
    window.addEventListener('hashchange', handler)
    return handler
  }

  private pauseListeners(to: HistoryLocationNormalized) {
    this.pauseState = {
      currentLocation: this.location,
      to,
    }
  }
}

function getFullPath(href: string): string {
  const hashIndex = href.indexOf('#')
  // if no hash is present, we normalize it to the version without the hash
  const fullPath = hashIndex < 0 ? '' : href.slice(hashIndex + 1)

  // ensure leading slash
  return fullPath.indexOf('/') < 0 ? '/' + fullPath : fullPath
}
