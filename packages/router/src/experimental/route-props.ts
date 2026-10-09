import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedGeneric,
  RouteMap,
} from '../typed-routes'

/**
 * Props declared by a route component. Lazy components are unwrapped. When
 * the component type is unknown, any props are accepted.
 *
 * @internal
 */
export type _ComponentProps<C> = unknown extends C
  ? Record<string, any>
  : C extends () => Promise<infer M>
    ? _ComponentProps<M extends { default: infer D } ? D : M>
    : C extends new (...args: any) => { $props: infer P }
      ? P
      : C extends (props: infer P, ...args: any) => any
        ? P
        : Record<string, any>

/**
 * `true` is only allowed if the route params can be passed as props. Generic
 * params (no typed routes) have an index signature and cannot be checked.
 *
 * @internal
 */
export type _RoutePropsTrue<Params, Props> = string extends keyof Params
  ? true
  : [Params] extends [Props]
    ? true
    : never

/**
 * Value of the `props` option for one view of a route record.
 *
 * - `true`: pass `route.params` as props. The params must match the props of
 *   the component.
 * - `false`: pass no props.
 * - object: pass these static props.
 * - function: receives the route location and returns the props.
 *
 * @typeParam Location - route location that renders the view
 * @typeParam Props - props of the component of the view
 */
export type EXPERIMENTAL_RouteRecordPropsOption<
  Location extends RouteLocationNormalizedLoadedGeneric =
    RouteLocationNormalizedLoadedGeneric,
  Props = Record<string, any>,
> =
  | false
  | _RoutePropsTrue<Location['params'], Props>
  | Props
  | ((to: Location) => Props)

/**
 * Route location that can render a record named `Name`: the record itself
 * and all its children.
 *
 * @internal
 */
export type _RouteLocationForRecordName<Name> = Name extends keyof RouteMap
  ? RouteLocationNormalizedLoaded<Name | RouteMap[Name]['childrenNames']>
  : RouteLocationNormalizedLoadedGeneric

/**
 * `props` option of a route record, one entry per view in `components`.
 *
 * @internal
 */
export type _RouteRecordPropsViews<
  Location extends RouteLocationNormalizedLoadedGeneric,
  Components,
> = {
  [View in keyof Components]?: EXPERIMENTAL_RouteRecordPropsOption<
    Location,
    _ComponentProps<Components[View]>
  >
}
