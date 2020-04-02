interface HistoryLocation {
  fullPath: string
  state?: HistoryState
}

export type RawHistoryLocation = HistoryLocation | string
export type HistoryLocationNormalized = Pick<HistoryLocation, 'fullPath'>
// pushState clones the state passed and do not accept everything
// it doesn't accept symbols, nor functions as values. It also ignores Symbols as keys
type HistoryStateValue =
  | string
  | number
  | boolean
  | null
  | HistoryState
  | HistoryStateArray

export interface HistoryState {
  [x: number]: HistoryStateValue
  [x: string]: HistoryStateValue
}
interface HistoryStateArray extends Array<HistoryStateValue> {}

export enum NavigationType {
  pop = 'pop',
  push = 'push',
}

export enum NavigationDirection {
  back = 'back',
  forward = 'forward',
  unknown = '',
}

export interface NavigationInformation {
  type: NavigationType
  direction: NavigationDirection
  distance: number
}

export interface NavigationCallback {
  (
    to: HistoryLocationNormalized,
    from: HistoryLocationNormalized,
    information: NavigationInformation
  ): void
}

// starting point for abstract history
const START_PATH = ''
export const START: HistoryLocationNormalized = {
  fullPath: START_PATH,
}

export type ValueContainer<T> = { value: T }

export interface RouterHistory {
  readonly base: string
  readonly location: HistoryLocationNormalized
  readonly state: HistoryState
  // readonly location: ValueContainer<HistoryLocationNormalized>

  push(to: RawHistoryLocation, data?: HistoryState): void
  replace(to: RawHistoryLocation, data?: HistoryState): void

  back(triggerListeners?: boolean): void
  forward(triggerListeners?: boolean): void
  go(distance: number, triggerListeners?: boolean): void

  listen(callback: NavigationCallback): () => void
  destroy(): void
}

// Generic utils

export function normalizeHistoryLocation(
  location: RawHistoryLocation
): HistoryLocationNormalized {
  return {
    // to avoid doing a typeof or in that is quite long
    fullPath: (location as HistoryLocation).fullPath || (location as string),
  }
}
