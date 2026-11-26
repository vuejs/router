import type { RouterHistory } from './common'

// Only built-in histories register a position. A custom history's user state
// must not be mistaken for router-owned entry information.
export const historyPositions = new WeakMap<
  RouterHistory,
  () => number | undefined
>()
