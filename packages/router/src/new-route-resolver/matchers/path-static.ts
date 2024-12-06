import type { MatcherPatternPath } from '../matcher-pattern'
import { miss } from './errors'

export class MatcherPathStatic implements MatcherPatternPath {
  constructor(private path: string) {}

  match(path: string) {
    if (this.path === path) return {}
    throw miss()
  }

  buildPath() {
    return this.path
  }
}
