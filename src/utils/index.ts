import { RouteRecord, RouteLocationNormalized, RouteLocation } from '../types'
import { guardToPromiseFn } from './guardToPromiseFn'

export * from './guardToPromiseFn'

type GuardType = 'beforeRouteEnter' | 'beforeRouteUpdate' | 'beforeRouteLeave'
export async function extractComponentsGuards(
  matched: RouteRecord[],
  guardType: GuardType,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  const guards: Array<() => Promise<void>> = []
  await Promise.all(
    matched.map(async record => {
      // TODO: cache async routes per record
      if ('component' in record) {
        const { component } = record
        const resolvedComponent = await (typeof component === 'function'
          ? component()
          : component)

        const guard = resolvedComponent[guardType]
        if (guard) {
          guards.push(guardToPromiseFn(guard, to, from))
        }
      } else {
        for (const name in record.components) {
          const component = record.components[name]
          const resolvedComponent = await (typeof component === 'function'
            ? component()
            : component)

          const guard = resolvedComponent[guardType]
          if (guard) {
            guards.push(guardToPromiseFn(guard, to, from))
          }
        }
      }
    })
  )

  return guards
}

export function last<T>(array: T[]): T {
  return array[array.length - 1]
}

export function isRouteLocation(route: any): route is RouteLocation {
  return typeof route === 'string' || (route && typeof route === 'object')
}
