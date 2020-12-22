import { RouteParams, RouteComponent, RouteParamsRaw } from '../types'
import { hasSymbol } from '../injectionSymbols'

export * from './env'

export function isESModule(obj: any): obj is { default: RouteComponent } {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

export const assign = Object.assign

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

export let noop = () => {}

export const omit = <T extends Record<string, any>>(
  object: T,
  paths: Array<keyof T>
) => {
  const result: Record<string, any> = {}
  for (let key in object) {
    if (
      paths.indexOf(key) >= 0 ||
      !Object.prototype.hasOwnProperty.call(object, key)
    ) {
      continue
    }
    result[key] = object[key]
  }
  return result
}
