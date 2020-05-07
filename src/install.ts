import { App, ComputedRef, reactive, computed } from 'vue'
import { Router } from './router'
import { RouterLink } from './RouterLink'
import { RouterView } from './RouterView'
import { isBrowser } from './utils'
import {
  START_LOCATION_NORMALIZED,
  RouteLocationNormalizedLoaded,
  NavigationGuardWithThis,
  NavigationGuard,
} from './types'
import { routerKey, routeLocationKey } from './injectionSymbols'

declare module '@vue/runtime-core' {
  interface ComponentCustomOptions {
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
    beforeRouteEnter?: NavigationGuardWithThis<undefined>

    /**
     * Guard called whenever the route that renders this component has changed but
     * it is reused for the new route. This allows you to guard for changes in
     * params, the query or the hash.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteUpdate?: NavigationGuard

    /**
     * Guard called when the router is navigating away from the current route that
     * is rendering this component.
     *
     * @param to - RouteLocationRaw we are navigating to
     * @param from - RouteLocationRaw we are navigating from
     * @param next - function to validate, cancel or modify (by redirecting) the
     * navigation
     */
    beforeRouteLeave?: NavigationGuard
  }

  interface ComponentCustomProperties {
    /**
     * Normalized current location. See {@link RouteLocationNormalizedLoaded}.
     */
    $route: RouteLocationNormalizedLoaded
    /**
     * {@link Router} instance used by the application.
     */
    $router: Router
  }
}

// used for the initial navigation client side to avoid pushing multiple times
// when the router is used in multiple apps
let installed: boolean | undefined

export function applyRouterPlugin(app: App, router: Router) {
  app.component('RouterLink', RouterLink)
  app.component('RouterView', RouterView)

  // TODO: add tests
  app.config.globalProperties.$router = router
  Object.defineProperty(app.config.globalProperties, '$route', {
    get: () => router.currentRoute.value,
  })

  // this initial navigation is only necessary on client, on server it doesn't
  // make sense because it will create an extra unnecessary navigation and could
  // lead to problems
  if (
    isBrowser &&
    !installed &&
    router.currentRoute.value === START_LOCATION_NORMALIZED
  ) {
    installed = true
    router.push(router.history.location.fullPath).catch(err => {
      if (__DEV__)
        console.error('Unhandled error when starting the router', err)
    })
  }

  const reactiveRoute = {} as {
    [k in keyof RouteLocationNormalizedLoaded]: ComputedRef<
      RouteLocationNormalizedLoaded[k]
    >
  }
  for (let key in START_LOCATION_NORMALIZED) {
    // @ts-ignore: the key matches
    reactiveRoute[key] = computed(() => router.currentRoute.value[key])
  }

  app.provide(routerKey, router)
  app.provide(routeLocationKey, reactive(reactiveRoute))
}
