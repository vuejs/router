import {
  RouteLocationNormalized,
  RouteParams,
  RouteComponent,
  RouteParamValue,
} from '../types'
import { RouteRecord } from '../matcher/types'
import { LocationQueryValue } from './query'
import { hasSymbol } from './injectionSymbols'

export function isESModule(obj: any): obj is { default: RouteComponent } {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
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

export function isSameRouteRecord(a: RouteRecord, b: RouteRecord): boolean {
  // since the original record has an undefined value for aliasOf
  // but all aliases point to the original record, this will always compare
  // the original record
  return (a.aliasOf || a) === (b.aliasOf || b)
}

export function isSameLocationObject(
  a: RouteLocationNormalized['query'],
  b: RouteLocationNormalized['query']
): boolean
export function isSameLocationObject(
  a: RouteLocationNormalized['params'],
  b: RouteLocationNormalized['params']
): boolean
export function isSameLocationObject(
  a: RouteLocationNormalized['query' | 'params'],
  b: RouteLocationNormalized['query' | 'params']
): boolean {
  if (Object.keys(a).length !== Object.keys(b).length) return false

  for (let key in a) {
    if (!isSameLocationObjectValue(a[key], b[key])) return false
  }

  return true
}

function isSameLocationObjectValue(
  a: LocationQueryValue | LocationQueryValue[],
  b: LocationQueryValue | LocationQueryValue[]
): boolean
function isSameLocationObjectValue(
  a: RouteParamValue | RouteParamValue[],
  b: RouteParamValue | RouteParamValue[]
): boolean
function isSameLocationObjectValue(
  a:
    | LocationQueryValue
    | LocationQueryValue[]
    | RouteParamValue
    | RouteParamValue[],
  b:
    | LocationQueryValue
    | LocationQueryValue[]
    | RouteParamValue
    | RouteParamValue[]
): boolean {
  return Array.isArray(a)
    ? isEquivalentArray(a, b)
    : Array.isArray(b)
    ? isEquivalentArray(b, a)
    : a === b
}

/**
 * Check if two arrays are the same or if an array with one single entry is the
 * same as another primitive value. Used to check query and parameters
 *
 * @param a array of values
 * @param b array of values or a single value
 */
function isEquivalentArray<T>(a: T[], b: T[] | T): boolean {
  return Array.isArray(b)
    ? a.length === b.length && a.every((value, i) => value === b[i])
    : a.length === 1 && a[0] === b
}
