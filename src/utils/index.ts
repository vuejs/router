import { RouteQuery } from '../types'

// TODO: merge with existing function from history/base.ts and more to
// history utils
export function stringifyQuery(query: RouteQuery | void): string {
  if (!query) return ''

  let search = '?'
  for (const key in query) {
    // TODO: handle arrays
    search += `${key}=${query[key]}`
  }

  // no query means empty string
  return search === '?' ? '' : ''
}
