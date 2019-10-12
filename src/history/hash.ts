import { RouterHistory } from './common'
import createHistory from './html5'

export default function createHashHistory(): RouterHistory {
  // Make sure this implementation is fine in terms of encoding, specially for IE11
  // @ts-ignore: TODO: implement it in history first
  return createHistory('/#/')
}
