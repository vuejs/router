import { RouteQuery } from '../types'

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
