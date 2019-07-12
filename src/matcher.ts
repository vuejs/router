import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  MatcherLocation,
  MatcherLocationNormalized,
  MatcherLocationRedirect,
  // TODO: add it to matched
  // MatchedRouteRecord,
} from './types/index'
import { NoRouteMatchError, InvalidRouteMatch } from './errors'

type NormalizedRouteRecord = Exclude<RouteRecord, { component: any }> // normalize component/components into components

interface RouteMatcher {
  re: RegExp
  resolve: (params?: RouteParams) => string
  record: NormalizedRouteRecord
  parent: RouteMatcher | void
  // TODO: children so they can be removed
  // children: RouteMatcher[]
  keys: string[]
  score: number
}

/**
 * Normalizes a RouteRecord into a MatchedRouteRecord. Creates a copy
 * @param record
 * @returns the normalized version
 */
export function normalizeRecord(
  record: Readonly<RouteRecord>
): NormalizedRouteRecord {
  if ('component' in record) {
    const { component, ...rest } = record
    // @ts-ignore I could do it type safe by copying again rest:
    // return {
    //   ...rest,
    //   components: { default: component }
    // }
    // but it's slower
    rest.components = { default: component }
    return rest as NormalizedRouteRecord
  }

  // otherwise just create a copy
  return { ...record }
}

enum PathScore {
  Segment = 4, // /a-segment
  SubSegment = 2, // /multiple-:things-in-one-:segment
  Static = 3, // /static
  Dynamic = 2, // /:someId
  DynamicCustomRegexp = 2.5, // /:someId(\\d+)
  Wildcard = -1, // /:namedWildcard(.*)
  SubWildcard = 1, // Wildcard as a subsegment
  Repeatable = -0.5, // /:w+ or /:w*
  Optional = -4, // /:w? or /:w*
  SubOptional = -0.1, // optional inside a subsegment /a-:w? or /a-:w*
  Root = 1, // just /
}

// allows to check if the user provided a custom regexp
const isDefaultPathRegExpRE = /^\[\^[^\]]+\]\+\?$/

export function createRouteMatcher(
  record: Readonly<NormalizedRouteRecord>,
  parent: RouteMatcher | void,
  options: pathToRegexp.RegExpOptions
): RouteMatcher {
  const keys: pathToRegexp.Key[] = []
  // options only use `delimiter`
  const tokens = pathToRegexp.parse(record.path, options)
  const re = pathToRegexp.tokensToRegExp(tokens, keys, options)
  // we pass a copy because later on we are modifying the original token array
  // to compute the score of routes
  const resolve = pathToRegexp.tokensToFunction([...tokens])

  let score = 0

  // console.log(tokens)
  // console.log('--- GROUPING ---')

  // special case for root path
  if (tokens.length === 1 && tokens[0] === '/') {
    score = 5
  } else {
    // allows us to group tokens into one single segment
    // it will point to the first token of the current group
    let currentSegment = 0
    // we group them in arrays to process them later
    const groups: Array<pathToRegexp.Token[]> = []
    // we skip the first element as it must be part of the first group
    const token = tokens[0]
    if (typeof token === 'string') {
      // TODO: refactor code in loop (right now it is duplicated)
      // we still need to check for / inside the string
      // remove the empty string because of the leading slash
      const sections = token.split('/').slice(1)
      if (sections.length > 1) {
        // the last one is going to replace currentSegment
        const last = sections.pop() as string // ts complains but length >= 2
        // we need to finalize previous group but we cannot use current entry
        // here we are sure that currentSegment < i because the token doesn't start with /
        // assert(currentSegment < i)
        const first = sections.shift() as string // ts complains but length >= 2
        // so we cut until the current segment and add the first section of current token as well
        groups.push(tokens.slice(currentSegment, 0).concat('/' + first))
        // equivalent to
        // groups.push(['/' + first])

        // we add the remaining sections as static groups
        for (const section of sections) {
          groups.push(['/' + section])
        }

        // we replace current entry with the last section and reset current segment
        tokens[0] = '/' + last
        // currentSegment = 0
      }
    }

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i]
      if (typeof token === 'string') {
        if (token.charAt(0) === '/') {
          // finalize previous group and start a new one
          groups.push(tokens.slice(currentSegment, i))
          currentSegment = i
        } else {
          // we still need to check for / inside the string
          const sections = token.split('/')
          if (sections.length > 1) {
            // the last one is going to replace currentSegment
            const last = sections.pop() as string // ts complains but length >= 2
            // we need to finalize previous group but we cannot use current entry
            // here we are sure that currentSegment < i because the token doesn't start with /
            // assert(currentSegment < i)
            const first = sections.shift() as string // ts complains but length >= 2
            // so we cut until the current segment and add the first section of current token as well
            groups.push(tokens.slice(currentSegment, i).concat(first))

            // we add the remaining sections as static groups
            for (const section of sections) {
              groups.push(['/' + section])
            }

            // we replace current entry with the last section and reset current segment
            tokens[i] = '/' + last
            currentSegment = i
          }
        }
      } else {
        if (token.prefix.charAt(0) === '/') {
          // finalize previous group and start a new one
          groups.push(tokens.slice(currentSegment, i))
          currentSegment = i
        }
      }
    }

    // add the remaining segment as one group
    // TODO: refactor the handling of ending with static like /:a/b/c
    if (currentSegment < tokens.length) {
      let token: pathToRegexp.Token
      if (
        tokens.length - currentSegment === 1 &&
        typeof (token = tokens[tokens.length - 1]) === 'string'
      ) {
        // the remaining group is a single string, so it must start with a leading /
        const sections = token.split('/').slice(1)
        // we add the remaining sections as static groups
        for (const section of sections) {
          groups.push(['/' + section])
        }
      } else {
        groups.push(tokens.slice(currentSegment))
      }
    }

    const scoreForSegment = function scoreForSegment(
      group: pathToRegexp.Token
    ): number {
      let score = PathScore.Segment
      if (typeof group === 'string') {
        score += group === '/' ? PathScore.Root : PathScore.Static
      } else {
        score +=
          group.pattern === '.*'
            ? PathScore.Wildcard
            : isDefaultPathRegExpRE.test(group.pattern)
            ? PathScore.Dynamic
            : PathScore.DynamicCustomRegexp
        score +=
          +group.optional * PathScore.Optional +
          +group.repeat * PathScore.Repeatable
        if (typeof group.name === 'number') throw new Error('Name your param')
        // keys.push(group.name)
      }
      return score
    }

    const scoreForSubSegment = function scoreForSubSegment(
      group: pathToRegexp.Token
    ): number {
      let score = 0
      if (typeof group === 'string') {
        // in a sub segment, it doesn't matter if it's root or not
        score += PathScore.Static
      } else {
        score +=
          group.pattern === '.*'
            ? PathScore.SubWildcard
            : isDefaultPathRegExpRE.test(group.pattern)
            ? PathScore.Dynamic
            : PathScore.DynamicCustomRegexp
        score += +group.optional * PathScore.SubOptional
        if (typeof group.name === 'number') throw new Error('Name your param')
        // keys.push(group.name)
      }
      return score
    }

    for (const group of groups) {
      // console.log(group)
      if (group.length === 1) {
        score += scoreForSegment(group[0])
      } else {
        score += PathScore.Segment + PathScore.SubSegment
        let multiplier = 1 / 10
        for (let i = 0; i < group.length; i++) {
          score += scoreForSubSegment(group[i]) * multiplier
          multiplier /= 10
        }
      }
      // segments.push('/' + section)
    }

    // console.log(record.path, { score })
    // console.log('____'.repeat(20))
  }

  // create the object before hand so it can be passed to children
  return {
    parent,
    record: record,
    re,
    // TODO: handle numbers differently. Maybe take the max one and say there are x unnamed keys
    keys: keys.map(key => String(key.name)),
    resolve,
    score,
  }
}

export class RouterMatcher {
  private matchers: RouteMatcher[] = []

  constructor(routes: RouteRecord[]) {
    for (const route of routes) {
      this.addRouteRecord(route)
    }
  }

  private addRouteRecord(
    record: Readonly<RouteRecord>,
    parent?: RouteMatcher
  ): void {
    const options: pathToRegexp.RegExpOptions = {}

    const recordCopy = normalizeRecord(record)

    if (parent) {
      // if the child isn't an absolute route
      if (record.path[0] !== '/') {
        let path = parent.record.path
        // only add the / delimiter if the child path isn't empty
        if (recordCopy.path) path += '/'
        path += record.path
        recordCopy.path = path
      }
    }

    // create the object before hand so it can be passed to children
    const matcher = createRouteMatcher(recordCopy, parent, options)

    if ('children' in record && record.children) {
      for (const childRecord of record.children) {
        this.addRouteRecord(childRecord, matcher)
      }
    }

    this.insertMatcher(matcher)
  }

  private insertMatcher(matcher: RouteMatcher) {
    let i = 0
    while (i < this.matchers.length && matcher.score <= this.matchers[i].score)
      i++
    this.matchers.splice(i, 0, matcher)
  }

  /**
   * Resolve a location without doing redirections so it can be used for anchors
   */
  resolveAsPath() {}

  /**
   * Transforms a MatcherLocation object into a normalized location
   * @param location MatcherLocation to resolve to a url
   */
  resolve(
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ): MatcherLocationNormalized | MatcherLocationRedirect {
    let matcher: RouteMatcher | void
    let params: RouteParams = {}
    let path: MatcherLocationNormalized['path']
    let name: MatcherLocationNormalized['name']

    if ('path' in location) {
      matcher = this.matchers.find(m => m.re.test(location.path))

      // TODO: if no matcher, return the location with an empty matched array
      // to allow non existent matches
      // TODO: warning of unused params if provided
      if (!matcher) throw new NoRouteMatchError(currentLocation, location)

      // no need to resolve the path with the matcher as it was provided
      path = location.path
      name = matcher.record.name

      // fill params
      const result = matcher.re.exec(path)

      if (!result) {
        throw new Error(`Error parsing path "${location.path}"`)
      }

      for (let i = 0; i < matcher.keys.length; i++) {
        const key = matcher.keys[i]
        const value = result[i + 1]
        if (!value) {
          throw new Error(
            `Error parsing path "${location.path}" when looking for param "${key}"`
          )
        }
        params[key] = value
      }

      if ('redirect' in matcher.record) {
        const { redirect } = matcher.record
        return {
          redirect,
          normalizedLocation: {
            name,
            path,
            matched: [],
            params,
          },
        }
      }
      // named route
    } else if ('name' in location) {
      matcher = this.matchers.find(m => m.record.name === location.name)

      if (!matcher) throw new NoRouteMatchError(currentLocation, location)

      name = matcher.record.name
      params = location.params || currentLocation.params // TODO: normalize params
      path = matcher.resolve(params)
      // TODO: check missing params

      if ('redirect' in matcher.record) {
        const { redirect } = matcher.record
        return {
          redirect,
          normalizedLocation: {
            name,
            path,
            matched: [],
            params,
          },
        }
      }
      // location is a relative path
    } else {
      // match by name or path of current route
      matcher = currentLocation.name
        ? this.matchers.find(m => m.record.name === currentLocation.name)
        : this.matchers.find(m => m.re.test(currentLocation.path))
      if (!matcher) throw new NoRouteMatchError(currentLocation, location)
      name = matcher.record.name
      params = location.params || currentLocation.params
      path = matcher.resolve(params)
    }

    // this should never happen because it will mean that the user ended up in a route
    // that redirects but ended up not redirecting
    if ('redirect' in matcher.record) throw new InvalidRouteMatch(location)

    const matched: MatcherLocationNormalized['matched'] = [matcher.record]
    let parentMatcher: RouteMatcher | void = matcher.parent
    while (parentMatcher) {
      // reversed order so parents are at the beginning
      // TODO: should be doable by typing RouteMatcher in a different way
      if ('redirect' in parentMatcher.record) throw new Error('TODO')
      matched.unshift(parentMatcher.record)
      parentMatcher = parentMatcher.parent
    }

    return {
      name,
      path,
      params,
      matched,
    }
  }
}
