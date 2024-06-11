import type { RouteMap } from './route-map'

/**
 * Utility type for raw and non raw params like :id+
 *
 */
export type ParamValueOneOrMore<isRaw extends boolean> = [
  ParamValue<isRaw>,
  ...ParamValue<isRaw>[]
]

/**
 * Utility type for raw and non raw params like :id*
 *
 */
export type ParamValueZeroOrMore<isRaw extends boolean> = true extends isRaw
  ? ParamValue<isRaw>[] | undefined | null
  : ParamValue<isRaw>[] | undefined

/**
 * Utility type for raw and non raw params like :id?
 *
 */
export type ParamValueZeroOrOne<isRaw extends boolean> = true extends isRaw
  ? string | number | null | undefined
  : string

/**
 * Utility type for raw and non raw params like :id
 *
 */
export type ParamValue<isRaw extends boolean> = true extends isRaw
  ? string | number
  : string

// TODO: finish this refactor
// export type ParamValueOneOrMoreRaw = [ParamValueRaw, ...ParamValueRaw[]]
// export type ParamValue =  string
// export type ParamValueRaw = string | number

/**
 * Generate a type safe params for a route location. Requires the name of the route to be passed as a generic.
 * @see {@link RouteParamsGeneric}
 */
export type RouteParams<Name extends keyof RouteMap = keyof RouteMap> =
  RouteMap[Name]['params']

/**
 * Generate a type safe raw params for a route location. Requires the name of the route to be passed as a generic.
 * @see {@link RouteParamsRaw}
 */
export type RouteParamsRaw<Name extends keyof RouteMap = keyof RouteMap> =
  RouteMap[Name]['paramsRaw']
