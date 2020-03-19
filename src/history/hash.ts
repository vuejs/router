import { RouterHistory } from './common'
import createWebHistory from './html5'

export default function createWebHashHistory(base: string = ''): RouterHistory {
  // Make sure this implementation is fine in terms of encoding, specially for IE11
  return createWebHistory(base + '/#')
}
