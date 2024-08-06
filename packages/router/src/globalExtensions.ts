import type {
  NavigationGuardWithThis,
  NavigationGuard,
  RouteLocationNormalizedLoaded,
} from './typed-routes'
import type { RouterView } from './RouterView'
import type { RouterLink } from './RouterLink'
import type { Router } from './router'
import type { TypesConfig } from './config'

declare module '@vue/runtime-core' {
  // 2024-Aug-06: Declaring this interface within 'vue' module as specified in Vue's API did not end up appending types for exposure to SFC <script/>
  // https://vuejs.org/guide/typescript/options-api.html#augmenting-global-properties
  // TODO: figure out why the types aren't properly exposed and nest interface within 'vue' module
  export interface ComponentCustomOptions {
    /**
     * Guard called when the router is navigating to the route that is rendering
     * this component from a different route. Differently from `beforeRouteUpdate`
     * and `beforeRouteLeave`, `beforeRouteEnter` does not have access to the
     * component instance through `this` because it triggers before the component
     * is even mounted.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteEnter?: TypesConfig extends Record<'beforeRouteEnter', infer T>
      ? T
      : NavigationGuardWithThis<undefined>

    /**
     * Guard called whenever the route that renders this component has changed, but
     * it is reused for the new route. This allows you to guard for changes in
     * params, the query or the hash.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteUpdate?: TypesConfig extends Record<'beforeRouteUpdate', infer T>
      ? T
      : NavigationGuard

    /**
     * Guard called when the router is navigating away from the current route that
     * is rendering this component.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteLeave?: TypesConfig extends Record<'beforeRouteLeave', infer T>
      ? T
      : NavigationGuard
  }

  // 2024-Aug-06: Declaring this interface within 'vue' module as specified in Vue's API did not end up appending types for exposure to SFC <template/>
  // https://vuejs.org/guide/typescript/options-api.html#augmenting-global-properties
  // TODO: figure out why the types aren't properly exposed and nest interface within 'vue' module
  export interface ComponentCustomProperties {
    /**
     * Normalized current location. See {@link RouteLocationNormalizedLoaded}.
     */
    $route: TypesConfig extends Record<'$route', infer T>
      ? T
      : RouteLocationNormalizedLoaded
    /**
     * {@link Router} instance used by the application.
     */
    $router: TypesConfig extends Record<'$router', infer T> ? T : Router
  }
}

declare module 'vue' {
  // 2024-Jul-31: this had been nested within '@vue/runtime-core' module, but was moved to the 'vue' module to adhere to Vue's API
  // https://vuejs.org/guide/typescript/options-api.html#augmenting-global-properties
  // Declaring this interface twice (once in each module) created issues
  export interface GlobalComponents {
    RouterView: TypesConfig extends Record<'RouterView', infer T>
      ? T
      : typeof RouterView
    RouterLink: TypesConfig extends Record<'RouterLink', infer T>
      ? T
      : typeof RouterLink
  }
}
