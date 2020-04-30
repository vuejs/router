import {
  RouteParamsRaw,
  RouteComponent,
  RouteParams,
  RouteParamValue,
  RouteParamValueRaw,
} from '../types'
import { hasSymbol } from '../injectionSymbols'

export * from './env'

export function isESModule(obj: any): obj is { default: RouteComponent } {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

export function applyToParams(
  fn: (v: RouteParamValueRaw) => string,
  params: RouteParamsRaw | undefined
): RouteParams

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

export function applyToParamsRaw(
  params: RouteParamsRaw | undefined
): RouteParams | undefined {
  return applyToParams(x => x.toString(), params)
}
