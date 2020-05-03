import {
  RouteParamsRaw,
  RouteComponent,
  RouteParams,
  RouteParamValue,
  RouteLocationAs,
  LocationAsPath,
  LocationAsRelative,
  LocationAsName,
} from '../types'
import { hasSymbol } from '../injectionSymbols'

export * from './env'

export function isESModule(obj: any): obj is { default: RouteComponent } {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

export function applyToParams<TValue>(
  fn: (v: TValue) => string,
  params: Record<string, TValue | TValue[]> | undefined
): RouteParams

// overload for `applyToParams.bind`
export function applyToParams(
  fn: (v: RouteParamValue) => string,
  params: RouteParams | undefined
): RouteParams

export function applyToParams(
  fn: (v: any) => string,
  params: RouteParams | RouteParamsRaw | undefined
): RouteParams {
  const newParams: RouteParams = {}

  for (const key in params) {
    const value = params[key]
    newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value)
  }

  return newParams
}

export const normalizeParams = (
  params: RouteParamsRaw | undefined
): RouteParams => {
  return applyToParams(x => '' + x, params)
}

export function isRouteLocationPath(
  r: any
): r is RouteLocationAs<LocationAsPath> {
  return 'path' in r && r.path
}

export function isRouteLocationRelative(
  r: any
): r is RouteLocationAs<LocationAsRelative> {
  return 'params' in r && r.params
}

export function isRouteLocationName(
  r: any
): r is RouteLocationAs<LocationAsName> {
  return 'name' in r && r.name
}
