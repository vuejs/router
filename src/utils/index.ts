import {
  RouteParams,
  RouteComponent,
  RouteParamsRaw,
  RouteParamValueRaw,
} from '../types'

export * from './env'

export function isESModule(obj: any): obj is { default: RouteComponent } {
  return obj.__esModule || obj[Symbol.toStringTag] === 'Module'
}

export const assign = Object.assign

export function applyToParams(
  fn: (v: string | number | null | undefined) => string,
  params: RouteParamsRaw | undefined
): RouteParams {
  const newParams: RouteParams = {}

  for (const key in params) {
    const value = params[key]
    newParams[key] = Array.isArray(value)
      ? value.map(fn)
      : fn(value as Exclude<RouteParamValueRaw, any[]>)
  }

  return newParams
}

export const noop = () => {}
