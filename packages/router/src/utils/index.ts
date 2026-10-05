import type {
  RouteParamsGeneric,
  RouteComponent,
  RouteParamsRawGeneric,
  RawRouteComponent,
} from '../types'

/**
 * Identity function that returns the value as is.
 *
 * @param v - the value to return
 *
 * @internal
 */
export const identityFn = <T>(v: T) => v

/**
 * Checks if a path is absolute, meaning it starts with a `/`.
 *
 * @param path - path to check
 *
 * @internal
 */
export const isAbsolutePath = (path: string): boolean => path.startsWith('/')

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

/**
 * Safe version of `Object.prototype.hasOwnProperty` that also works on objects
 * that shadow `hasOwnProperty` or have no prototype.
 *
 * @param obj - object to check
 * @param key - key to look for
 * @internal
 */
export function hasOwn(obj: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

/**
 * Sets a regular own property on an object. A `__proto__` key is defined as a
 * normal data property: a plain assignment would invoke the `__proto__` setter
 * and change the object's prototype (or be silently ignored) instead.
 *
 * @param obj - object to write to
 * @param key - key to write
 * @param value - value to write
 * @internal
 */
export function setOwnProperty(
  obj: Record<string, unknown>,
  key: string,
  value: unknown
): void {
  if (key === '__proto__') {
    Object.defineProperty(obj, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    })
  } else {
    obj[key] = value
  }
}

/**
 * `Object.assign` equivalent that only copies own enumerable properties and
 * keeps `__proto__` as a regular key instead of changing the target's
 * prototype.
 *
 * @param target - object to copy properties into
 * @param sources - objects to copy properties from
 * @internal
 */
export function assignOwn<T extends object>(
  target: T,
  ...sources: Array<object | null | undefined>
): T {
  for (const source of sources) {
    if (!source) continue
    for (const key of Object.keys(source)) {
      setOwnProperty(
        target as Record<string, unknown>,
        key,
        (source as Record<string, unknown>)[key]
      )
    }
  }
  return target
}

export function applyToParams(
  fn: (v: string | number | null | undefined) => string,
  params: RouteParamsRawGeneric | undefined
): RouteParamsGeneric {
  const newParams: RouteParamsGeneric = {}

  for (const key in params) {
    if (!hasOwn(params, key)) continue
    const value = params[key]
    setOwnProperty(newParams, key, isArray(value) ? value.map(fn) : fn(value))
  }

  return newParams
}

/**
 * Transforms a value or a function that returns a value to a value.
 *
 * @param valFn either a value or a function that returns a value
 * @param args  arguments to pass to the function if `valFn` is a function
 *
 * @internal
 */
export function toValueWithArgs<T, Args extends any[]>(
  valFn: T | ((...args: Args) => T),
  ...args: Args
): T {
  return typeof valFn === 'function'
    ? (valFn as (...args: Args) => T)(...args)
    : valFn
}

export const noop = () => {}

/**
 * Typesafe alternative to Array.isArray
 * https://github.com/microsoft/TypeScript/pull/48228
 *
 * @internal
 */
export const isArray: (
  arg: ArrayLike<any> | unknown
) => arg is ReadonlyArray<any> = Array.isArray

export function mergeOptions<T extends object>(
  defaults: T,
  partialOptions: Partial<T>
): T {
  const options = {} as T
  for (const key in defaults) {
    options[key] = key in partialOptions ? partialOptions[key]! : defaults[key]
  }

  return options
}
