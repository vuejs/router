import { RouteParams, RouteComponent, RouteParamsRaw } from '../types'
import { hasSymbol } from '../injectionSymbols'

export * from './env'

export function isESModule(obj: any): obj is { default: RouteComponent } {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

export function applyToParams(
  fn: (v: string | number) => string,
  params: RouteParamsRaw | undefined
): RouteParams {
  const newParams: RouteParams = {}

  for (const key in params) {
    const value = params[key]
    newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value)
  }

  return newParams
}
