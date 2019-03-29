import {
  START,
  HistoryLocation,
  NavigationCallback,
  RemoveListener,
} from '../types/index'

export default abstract class BaseHistory {
  // previousState: object
  location: HistoryLocation = START
  base: string = ''

  /**
   * Sync source with a different location.
   * Adds an entry to the history
   * @param to URL to go to
   */
  abstract push(to: HistoryLocation, data?: any): void

  /**
   * Syncs source with a different location
   * Replaces current entry in the history
   * @param to URL to go to
   */
  abstract replace(to: HistoryLocation): void

  /**
   * Notifies back whenever the location changes due to user interactions
   * outside of the applicaiton. For example, going back/forward on a
   * web browser
   * @param callback callback to be called whenever the route changes
   * @returns
   */
  abstract listen(callback: NavigationCallback): RemoveListener

  /**
   * ensure the current location matches the external source
   * For example, in HTML5 and hash history, that would be
   * location.pathname
   * TODO: is this necessary?
   */
  abstract ensureLocation(): void
}
