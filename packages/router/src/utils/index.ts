import {
  RouteParamsGeneric,
  RouteComponent,
  RouteParamsRawGeneric,
  RouteParamValueRaw,
  RawRouteComponent,
} from '../types'

export * from './env'

/**
 * Allows differentiating lazy components from functional components and vue-class-component
 * @internal
 *
 * @param component
 */
export function isRouteComponent(
  component: RawRouteComponent
): component is RouteComponent {
  return (
    typeof component === 'object' ||
    'displayName' in component ||
    'props' in component ||
    '__vccOpts' in component
  )
}

export function isESModule(obj: any): obj is { default: RouteComponent } {
  return (
    obj.__esModule ||
    obj[Symbol.toStringTag] === 'Module' ||
    // support CF with dynamic imports that do not
    // add the Module string tag
    (obj.default && isRouteComponent(obj.default))
  )
}

export const assign = Object.assign

export function applyToParams(
  fn: (v: string | number | null | undefined) => string,
  params: RouteParamsRawGeneric | undefined
): RouteParamsGeneric {
  const newParams: RouteParamsGeneric = {}

  for (const key in params) {
    const value = params[key]
    newParams[key] = isArray(value)
      ? value.map(fn)
      : fn(value as Exclude<RouteParamValueRaw, any[]>)
  }

  return newParams
}

export const noop = () => {}

/**
 * Typesafe alternative to Array.isArray
 * https://github.com/microsoft/TypeScript/pull/48228
 */
export const isArray: (arg: ArrayLike<any> | any) => arg is ReadonlyArray<any> =
  Array.isArray
