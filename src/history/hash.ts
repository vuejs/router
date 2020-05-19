import { RouterHistory } from './common'
import { createWebHistory } from './html5'

/**
 * Creates a hash history.
 *
 * @param base optional base to provide. Defaults to `/`
 */
export function createWebHashHistory(base: string = '/'): RouterHistory {
  // Make sure this implementation is fine in terms of encoding, specially for IE11
  return createWebHistory(location.host ? base + '#' : '#')
}
