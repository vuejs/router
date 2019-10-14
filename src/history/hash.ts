import { RouterHistory } from './common'
import createHistory from './html5'

export default function createHashHistory(base: string = ''): RouterHistory {
  // Make sure this implementation is fine in terms of encoding, specially for IE11
  return createHistory('/#' + base)
}
