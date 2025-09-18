import { miss } from './errors'
import { MatcherPatternPath } from './matcher-pattern'

/**
 * Allows matching a static path folllowed by anything.
 *
 * @example
 *
 * ```ts
 * const matcher = new MatcherPatternPathStar('/team')
 * matcher.match('/team/123') // { pathMatch: '/123' }
 * matcher.match('/team/123/more') // { pathMatch: '/123/more' }
 * matcher.match('/team-123') // { pathMatch: '-123' }
 * matcher.match('/team') // { pathMatch: '' }
 * matcher.build({ pathMatch: '/123' }) // '/team/123'
 * ```
 */
export class MatcherPatternPathStar
  implements MatcherPatternPath<{ pathMatch: string }>
{
  private path: string
  constructor(path: string = '') {
    this.path = path.toLowerCase()
  }

  match(path: string): { pathMatch: string } {
    if (!path.toLowerCase().startsWith(this.path)) {
      throw miss()
    }
    return {
      pathMatch: path.slice(this.path.length),
    }
  }

  build(params: { pathMatch: string }): string {
    return this.path + params.pathMatch
  }
}
