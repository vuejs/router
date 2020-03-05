import { RouteLocationNormalized, RouteParams, Immutable } from '../types'
import { guardToPromiseFn } from './guardToPromiseFn'
import { RouteRecordNormalized } from '../matcher/types'
import { LocationQueryValue } from './query'

export * from './guardToPromiseFn'

type GuardType = 'beforeRouteEnter' | 'beforeRouteUpdate' | 'beforeRouteLeave'
export async function extractComponentsGuards(
  matched: RouteRecordNormalized[],
  guardType: GuardType,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  const guards: Array<() => Promise<void>> = []
  await Promise.all(
    matched.map(async record => {
      // TODO: cache async routes per record
      for (const name in record.components) {
        const component = record.components[name]
        // TODO: handle Vue.extend views
        // if ('options' in component) throw new Error('TODO')
        const resolvedComponent = component
        // TODO: handle async component
        // const resolvedComponent = await (typeof component === 'function'
        //   ? component()
        //   : component)

        const guard = resolvedComponent[guardType]
        if (guard) {
          guards.push(guardToPromiseFn(guard, to, from))
        }
      }
    })
  )

  return guards
}

export function applyToParams(
  fn: (v: string) => string,
  params: RouteParams | undefined
): RouteParams {
  const newParams: RouteParams = {}

  for (const key in params) {
    const value = params[key]
    newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value)
  }

  return newParams
}

export function isSameRouteRecord(
  a: Immutable<RouteRecordNormalized>,
  b: Immutable<RouteRecordNormalized>
): boolean {
  // TODO: handle aliases
  return a === b
}

export function isSameLocationObject(
  a: Immutable<RouteLocationNormalized['query']>,
  b: Immutable<RouteLocationNormalized['query']>
): boolean
export function isSameLocationObject(
  a: Immutable<RouteLocationNormalized['params']>,
  b: Immutable<RouteLocationNormalized['params']>
): boolean
export function isSameLocationObject(
  a: Immutable<RouteLocationNormalized['query' | 'params']>,
  b: Immutable<RouteLocationNormalized['query' | 'params']>
): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  let i = 0
  let key: string
  while (i < aKeys.length) {
    key = aKeys[i]
    if (key !== bKeys[i]) return false
    if (!isSameLocationObjectValue(a[key], b[key])) return false
    i++
  }

  return true
}

function isSameLocationObjectValue(
  a: Immutable<LocationQueryValue | LocationQueryValue[]>,
  b: Immutable<LocationQueryValue | LocationQueryValue[]>
): boolean
function isSameLocationObjectValue(
  a: Immutable<RouteParams | RouteParams[]>,
  b: Immutable<RouteParams | RouteParams[]>
): boolean
function isSameLocationObjectValue(
  a: Immutable<
    LocationQueryValue | LocationQueryValue[] | RouteParams | RouteParams[]
  >,
  b: Immutable<
    LocationQueryValue | LocationQueryValue[] | RouteParams | RouteParams[]
  >
): boolean {
  if (typeof a !== typeof b) return false
  // both a and b are arrays
  if (Array.isArray(a))
    return (
      a.length === (b as any[]).length &&
      a.every((value, i) => value === (b as LocationQueryValue[])[i])
    )
  return a === b
}
