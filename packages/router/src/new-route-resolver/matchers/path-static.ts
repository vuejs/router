import type { MatcherPatternPath } from '../matcher-pattern'

export class PathMatcherStatic implements MatcherPatternPath {
  constructor(private path: string) {}

  match(path: string) {
    if (this.path === path) return {}
    throw new Error()
    // return this.path === path ? {} : null
  }

  buildPath() {
    return this.path
  }
}
