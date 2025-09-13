import { App, shallowReactive, shallowRef, unref } from 'vue'
import {
  parseURL,
  stringifyURL,
  isSameRouteLocation,
  isSameRouteRecord,
  START_LOCATION_NORMALIZED,
} from '../location'

import {
  normalizeQuery,
  parseQuery as originalParseQuery,
  stringifyQuery as originalStringifyQuery,
  LocationQuery,
} from '../query'
import type {
  RouteLocationRaw,
  RouteParams,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteLocationResolved,
  RouteRecordNameGeneric,
  RouteLocation,
} from '../typed-routes'
import type { Router, RouterOptions } from '../router'
import { createRouterMatcher } from '../matcher'
import { useCallbacks } from '../utils/callbacks'
import { extractComponentsGuards, guardToPromiseFn } from '../navigationGuards'
import {
  createRouterError,
  ErrorTypes,
  isNavigationFailure,
  NavigationFailure,
  NavigationRedirectError,
} from '../errors'
import { applyToParams, assign, isArray, isBrowser } from '../utils'
import { warn } from '../warning'
import { decode, encodeHash, encodeParam } from '../encoding'
import {
  isRouteLocation,
  isRouteName,
  Lazy,
  MatcherLocationRaw,
  RouteLocationOptions,
  RouteRecordRaw,
} from '../types'
import { RouterLink } from '../RouterLink'
import { RouterView } from '../RouterView'
import {
  routeLocationKey,
  routerKey,
  routerViewLocationKey,
} from '../injectionSymbols'
import {
  NavigationDirection,
  NavigationInformation,
  NavigationType,
  RouterHistory,
} from '../history/common'
import { RouteRecordNormalized } from '../matcher/types'

export interface RouterApiOptions extends Omit<RouterOptions, 'history'> {
  base?: string
  location: string
}

export function createNavigationApiRouter(options: RouterApiOptions): Router {
  const matcher = createRouterMatcher(options.routes, options)
  const parseQuery = options.parseQuery || originalParseQuery
  const stringifyQuery = options.stringifyQuery || originalStringifyQuery

  const beforeGuards = useCallbacks<any>()
  const beforeResolveGuards = useCallbacks<any>()
  const afterGuards = useCallbacks<any>()
  const errorListeners = useCallbacks<any>()

  const currentRoute = shallowRef<RouteLocationNormalizedLoaded>(
    START_LOCATION_NORMALIZED
  )

  let isRevertingNavigation = false
  let pendingLocation: RouteLocation | undefined
  let lastSuccessfulLocation: RouteLocationNormalizedLoaded =
    START_LOCATION_NORMALIZED

  let started: boolean | undefined
  const installedApps = new Set<App>()

  function checkCanceledNavigation(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): NavigationFailure | void {
    if (pendingLocation !== to) {
      return createRouterError<NavigationFailure>(
        ErrorTypes.NAVIGATION_CANCELLED,
        {
          from,
          to,
        }
      )
    }
  }

  function checkCanceledNavigationAndReject(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): Promise<void> {
    const error = checkCanceledNavigation(to, from)
    return error ? Promise.reject(error) : Promise.resolve()
  }

  function runWithContext<T>(fn: () => T): T {
    const app: App | undefined = installedApps.values().next().value
    // support Vue < 3.3
    return app && typeof app.runWithContext === 'function'
      ? app.runWithContext(fn)
      : fn()
  }

  function runGuardQueue(guards: Lazy<any>[]): Promise<any> {
    return guards.reduce(
      (promise, guard) => promise.then(() => runWithContext(guard)),
      Promise.resolve()
    )
  }

  let ready: boolean = false
  const readyHandlers = useCallbacks<[(v: any) => void, (e: any) => void]>()

  async function resolveNavigationGuards(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    navigationInfo?: NavigationInformation
  ): Promise<void> {
    const [leavingRecords, updatingRecords, enteringRecords] =
      extractChangingRecords(to, from)

    let guards = extractComponentsGuards(
      leavingRecords.reverse(),
      'beforeRouteLeave',
      to,
      from,
      undefined,
      navigationInfo
    )

    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(
      null,
      to,
      from
    )

    guards.push(canceledNavigationCheck)

    await runGuardQueue(guards)

    guards = []
    for (const guard of beforeGuards.list()) {
      guards.push(guardToPromiseFn(guard, to, from, { info: navigationInfo }))
    }
    await runGuardQueue(guards)

    guards = extractComponentsGuards(
      updatingRecords,
      'beforeRouteUpdate',
      to,
      from
    )
    await runGuardQueue(guards)

    guards = []
    for (const record of enteringRecords) {
      if (record.beforeEnter) {
        if (isArray(record.beforeEnter)) {
          for (const beforeEnter of record.beforeEnter)
            guards.push(
              guardToPromiseFn(beforeEnter, to, from, { info: navigationInfo })
            )
        } else {
          guards.push(
            guardToPromiseFn(record.beforeEnter, to, from, {
              info: navigationInfo,
            })
          )
        }
      }
    }
    await runGuardQueue(guards)

    // Resolve async components and run beforeRouteEnter
    guards = extractComponentsGuards(
      enteringRecords,
      'beforeRouteEnter',
      to,
      from,
      undefined,
      navigationInfo
    )
    await runGuardQueue(guards)

    guards = []
    for (const guard of beforeResolveGuards.list()) {
      guards.push(guardToPromiseFn(guard, to, from, { info: navigationInfo }))
    }
    await runGuardQueue(guards)
  }

  function finalizeNavigation(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure
  ) {
    if (!failure) {
      lastSuccessfulLocation = to
    }
    currentRoute.value = to as RouteLocationNormalizedLoaded
    markAsReady()
    afterGuards.list().forEach(guard => guard(to, from, failure))
  }

  function markAsReady(err?: any): void {
    if (!ready) {
      ready = !err
      readyHandlers
        .list()
        // @ts-expect-error we need to add some types
        .forEach(([resolve, reject]) => (err ? reject(err) : resolve()))
      readyHandlers.reset()
    }
  }

  function isReady(): Promise<void> {
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
      return Promise.resolve()
    return new Promise((resolve, reject) => {
      readyHandlers.add([resolve, reject])
    })
  }

  function triggerError(
    error: any,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded
  ): Promise<unknown> {
    markAsReady(error)
    const list = errorListeners.list()
    if (list.length) {
      list.forEach(handler => handler(error, to, from))
    } else {
      console.error('uncaught error during route navigation:')
      console.error(error)
    }
    return Promise.reject(error)
  }

  function go(delta: number) {
    // Case 1: go(0) should trigger a reload.
    if (delta === 0) {
      window.navigation.reload()
      return
    }

    // Get the current state safely, without using non-null assertions ('!').
    const entries = window.navigation.entries()
    const currentIndex = window.navigation.currentEntry?.index

    // If we don't have a current index, we can't proceed.
    if (currentIndex === undefined) {
      return
    }

    // Calculate the target index in the history stack.
    const targetIndex = currentIndex + delta

    // Validate that the target index is within the bounds of the entries array.
    // This is the key check that prevents runtime errors.
    if (targetIndex >= 0 && targetIndex < entries.length) {
      // Each history entry has a unique 'key'. We get the key for our target entry...
      // Safely get the target entry from the array.
      const targetEntry = entries[targetIndex]

      // Add a check to ensure the entry is not undefined before accessing its key.
      // This satisfies TypeScript's strict checks.
      if (targetEntry) {
        window.navigation.traverseTo(targetEntry.key)
      } else {
        // This case is unlikely if the index check passed, but it adds robustness.
        console.warn(
          `go(${delta}) failed: No entry found at index ${targetIndex}.`
        )
      }
    } else {
      console.warn(
        `go(${delta}) failed: target index ${targetIndex} is out of bounds.`
      )
    }
  }

  function locationAsObject(
    to: RouteLocationRaw | RouteLocationNormalized
  ): Exclude<RouteLocationRaw, string> | RouteLocationNormalized {
    return typeof to === 'string'
      ? parseURL(parseQuery, to, currentRoute.value.path)
      : assign({}, to)
  }

  function handleRedirectRecord(to: RouteLocation): RouteLocationRaw | void {
    const lastMatched = to.matched[to.matched.length - 1]
    if (lastMatched && lastMatched.redirect) {
      const { redirect } = lastMatched
      let newTargetLocation =
        typeof redirect === 'function' ? redirect(to) : redirect

      if (typeof newTargetLocation === 'string') {
        newTargetLocation =
          newTargetLocation.includes('?') || newTargetLocation.includes('#')
            ? (newTargetLocation = locationAsObject(newTargetLocation))
            : // force empty params
              { path: newTargetLocation }
        // @ts-expect-error: force empty params when a string is passed to let
        // the router parse them again
        newTargetLocation.params = {}
      }

      if (
        __DEV__ &&
        newTargetLocation.path == null &&
        !('name' in newTargetLocation)
      ) {
        warn(
          `Invalid redirect found:\n${JSON.stringify(
            newTargetLocation,
            null,
            2
          )}\n when navigating to "${
            to.fullPath
          }". A redirect must contain a name or path. This will break in production.`
        )
        throw new Error('Invalid redirect')
      }

      return assign(
        {
          query: to.query,
          hash: to.hash,
          // avoid transferring params if the redirect has a path
          params: newTargetLocation.path != null ? {} : to.params,
        },
        newTargetLocation
      )
    }
  }

  async function navigate(
    to: RouteLocationRaw,
    options: { replace?: boolean; state?: any } = {}
  ): Promise<NavigationFailure | void> {
    const { replace = false, state } = options
    const toLocation = resolve(to)
    const from = currentRoute.value

    const redirect = handleRedirectRecord(toLocation)
    if (redirect) {
      return navigate(assign({ replace }, redirect), { replace: true, state })
    }

    pendingLocation = toLocation as RouteLocationNormalized

    if (
      !(to as RouteLocationOptions).force &&
      isSameRouteLocation(stringifyQuery, from, toLocation)
    ) {
      const failure = createRouterError<NavigationFailure>(
        ErrorTypes.NAVIGATION_DUPLICATED,
        {
          to: toLocation as RouteLocationNormalized,
          from,
        }
      )
      finalizeNavigation(from, from, failure)
      return failure
    }

    pendingLocation = toLocation as RouteLocationNormalized

    const navOptions: NavigationNavigateOptions = {
      state: (to as RouteLocationOptions).state,
    }
    if (replace) {
      navOptions.history = 'replace'
    }
    window.navigation.navigate(toLocation.href, navOptions)
  }

  const normalizeParams = applyToParams.bind(
    null,
    paramValue => '' + paramValue
  )
  const encodeParams = applyToParams.bind(null, encodeParam)
  const decodeParams: (params: RouteParams | undefined) => RouteParams =
    // @ts-expect-error: intentionally avoid the type check
    applyToParams.bind(null, decode)

  function addRoute(
    parentOrRoute: NonNullable<RouteRecordNameGeneric> | RouteRecordRaw,
    route?: RouteRecordRaw
  ) {
    let parent: Parameters<(typeof matcher)['addRoute']>[1] | undefined
    let record: RouteRecordRaw
    if (isRouteName(parentOrRoute)) {
      parent = matcher.getRecordMatcher(parentOrRoute)
      if (__DEV__ && !parent) {
        warn(
          `Parent route "${String(
            parentOrRoute
          )}" not found when adding child route`,
          route
        )
      }
      record = route!
    } else {
      record = parentOrRoute
    }

    return matcher.addRoute(record, parent)
  }

  function removeRoute(name: NonNullable<RouteRecordNameGeneric>) {
    const recordMatcher = matcher.getRecordMatcher(name)
    if (recordMatcher) {
      matcher.removeRoute(recordMatcher)
    } else if (__DEV__) {
      warn(`Cannot remove non-existent route "${String(name)}"`)
    }
  }

  function getRoutes() {
    return matcher.getRoutes().map(routeMatcher => routeMatcher.record)
  }

  function hasRoute(name: NonNullable<RouteRecordNameGeneric>): boolean {
    return !!matcher.getRecordMatcher(name)
  }

  function createHref(base: string, path: string): string {
    if (path === '/') return base || '/'
    return (
      (base.endsWith('/') ? base.slice(0, -1) : base) +
      (path.startsWith('/') ? '' : '/') +
      path
    )
  }

  function resolve(
    rawLocation: RouteLocationRaw,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocationResolved {
    // const resolve: Router['resolve'] = (rawLocation: RouteLocationRaw, currentLocation) => {
    // const objectLocation = routerLocationAsObject(rawLocation)
    // we create a copy to modify it later
    currentLocation = assign({}, currentLocation || currentRoute.value)
    if (typeof rawLocation === 'string') {
      const locationNormalized = parseURL(
        parseQuery,
        rawLocation,
        currentLocation.path
      )
      const matchedRoute = matcher.resolve(
        { path: locationNormalized.path },
        currentLocation
      )

      const href = createHref(locationNormalized.fullPath, options.base || '/')
      if (__DEV__) {
        if (href.startsWith('//'))
          warn(
            `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`
          )
        else if (!matchedRoute.matched.length) {
          warn(`No match found for location with path "${rawLocation}"`)
        }
      }

      // locationNormalized is always a new object
      return assign(locationNormalized, matchedRoute, {
        params: decodeParams(matchedRoute.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: undefined,
        href,
      })
    }

    if (__DEV__ && !isRouteLocation(rawLocation)) {
      warn(
        `router.resolve() was passed an invalid location. This will fail in production.\n- Location:`,
        rawLocation
      )
      return resolve({})
    }

    let matcherLocation: MatcherLocationRaw

    // path could be relative in object as well
    if (rawLocation.path != null) {
      if (
        __DEV__ &&
        'params' in rawLocation &&
        !('name' in rawLocation) &&
        // @ts-expect-error: the type is never
        Object.keys(rawLocation.params).length
      ) {
        warn(
          `Path "${rawLocation.path}" was passed with params but they will be ignored. Use a named route alongside params instead.`
        )
      }
      matcherLocation = assign({}, rawLocation, {
        path: parseURL(parseQuery, rawLocation.path, currentLocation.path).path,
      })
    } else {
      // remove any nullish param
      const targetParams = assign({}, rawLocation.params)
      for (const key in targetParams) {
        if (targetParams[key] == null) {
          delete targetParams[key]
        }
      }
      // pass encoded values to the matcher, so it can produce encoded path and fullPath
      matcherLocation = assign({}, rawLocation, {
        params: encodeParams(targetParams),
      })
      // current location params are decoded, we need to encode them in case the
      // matcher merges the params
      currentLocation.params = encodeParams(currentLocation.params)
    }

    const matchedRoute = matcher.resolve(matcherLocation, currentLocation)
    const hash = rawLocation.hash || ''

    if (__DEV__ && hash && !hash.startsWith('#')) {
      warn(
        `A \`hash\` should always start with the character "#". Replace "${hash}" with "#${hash}".`
      )
    }

    // the matcher might have merged current location params, so
    // we need to run the decoding again
    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params))

    const fullPath = stringifyURL(
      stringifyQuery,
      assign({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path,
      })
    )

    const href = createHref(fullPath, options.base || '/')
    if (__DEV__) {
      if (href.startsWith('//')) {
        warn(
          `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`
        )
      } else if (!matchedRoute.matched.length) {
        warn(
          `No match found for location with path "${
            rawLocation.path != null ? rawLocation.path : rawLocation
          }"`
        )
      }
    }

    return assign(
      {
        fullPath,
        // keep the hash encoded so fullPath is effectively path + encodedQuery +
        // hash
        hash,
        query:
          // if the user is using a custom query lib like qs, we might have
          // nested objects, so we keep the query as is, meaning it can contain
          // numbers at `$route.query`, but at the point, the user will have to
          // use their own type anyway.
          // https://github.com/vuejs/router/issues/328#issuecomment-649481567
          stringifyQuery === originalStringifyQuery
            ? normalizeQuery(rawLocation.query)
            : ((rawLocation.query || {}) as LocationQuery),
      },
      matchedRoute,
      {
        redirectedFrom: undefined,
        href,
      }
    )
  }

  async function handleNavigate(event: NavigateEvent) {
    if (!event.canIntercept) return

    event.intercept({
      async handler() {
        const destination = new URL(event.destination.url)
        const pathWithSearchAndHash =
          destination.pathname + destination.search + destination.hash
        const to = resolve(pathWithSearchAndHash) as RouteLocationNormalized
        const from = currentRoute.value
        pendingLocation = to

        let navigationInfo: NavigationInformation | undefined
        if (event.navigationType === 'traverse') {
          const fromIndex = window.navigation.currentEntry?.index ?? -1
          const toIndex = event.destination.index
          const delta = fromIndex === -1 ? 0 : toIndex - fromIndex

          navigationInfo = {
            type: NavigationType.pop, // 'traverse' maps to 'pop' in vue-router's terminology.
            direction:
              delta > 0
                ? NavigationDirection.forward
                : NavigationDirection.back,
            delta,
          }
        } else if (
          event.navigationType === 'push' ||
          event.navigationType === 'replace'
        ) {
          navigationInfo = {
            type:
              event.navigationType === 'push'
                ? NavigationType.push
                : NavigationType.pop,
            direction: NavigationDirection.unknown, // No specific direction for push/replace.
            delta: event.navigationType === 'push' ? 1 : 0,
          }
        }

        try {
          await resolveNavigationGuards(to, from, navigationInfo)
          finalizeNavigation(to, from)
        } catch (error) {
          const failure = error as NavigationFailure

          afterGuards.list().forEach(guard => guard(to, from, failure))

          if (
            isNavigationFailure(failure, ErrorTypes.NAVIGATION_GUARD_REDIRECT)
          ) {
            navigate((failure as NavigationRedirectError).to, { replace: true })
          } else if (
            !isNavigationFailure(failure, ErrorTypes.NAVIGATION_CANCELLED)
          ) {
            triggerError(failure, to, from)
          }
          throw failure
        }
      },
    })
  }

  async function handleCurrentEntryChange(
    event: NavigationCurrentEntryChangeEvent
  ) {
    if (isRevertingNavigation) {
      isRevertingNavigation = false
      return
    }

    if (event.navigationType !== 'traverse') {
      return
    }

    const destination = new URL(window.navigation.currentEntry!.url!)
    const pathWithSearchAndHash =
      destination.pathname + destination.search + destination.hash
    const to = resolve(pathWithSearchAndHash) as RouteLocationNormalized
    const from = lastSuccessfulLocation

    const fromIndex = event.from.index
    const toIndex = window.navigation.currentEntry!.index
    const delta = toIndex - fromIndex
    const navigationInfo: NavigationInformation = {
      type: NavigationType.pop,
      direction:
        delta > 0 ? NavigationDirection.forward : NavigationDirection.back,
      delta,
    }

    pendingLocation = to

    try {
      // then browser has been done the navigation, we just run the guards
      await resolveNavigationGuards(to, from, navigationInfo)
      finalizeNavigation(to, from)
    } catch (error) {
      const failure = error as NavigationFailure

      isRevertingNavigation = true
      go(fromIndex - toIndex)

      afterGuards.list().forEach(guard => guard(to, from, failure))

      if (isNavigationFailure(failure, ErrorTypes.NAVIGATION_GUARD_REDIRECT)) {
        navigate((failure as NavigationRedirectError).to, { replace: true })
      } else if (
        !isNavigationFailure(failure, ErrorTypes.NAVIGATION_CANCELLED)
      ) {
        triggerError(failure, to, from)
      }
    }
  }

  window.navigation.addEventListener('navigate', handleNavigate)
  window.navigation.addEventListener(
    'currententrychange',
    handleCurrentEntryChange
  )

  function destroy() {
    window.navigation.removeEventListener('navigate', handleNavigate)
    window.navigation.removeEventListener(
      'currententrychange',
      handleCurrentEntryChange
    )
  }

  const history: RouterHistory = {
    base: options.base || '/',
    location: options.location,
    state: undefined!,
    createHref: createHref.bind(null, options.base || '/'),
    destroy,
    go,
    listen(): () => void {
      throw new Error('unsupported operation')
    },
    push: (to: RouteLocationRaw) => navigate(to),
    replace: (to: RouteLocationRaw) => navigate(to, { replace: true }),
  }

  const router: Router = {
    currentRoute,
    listening: true,

    addRoute,
    removeRoute,
    clearRoutes: matcher.clearRoutes,
    hasRoute,
    getRoutes,
    resolve,
    options: {
      ...options,
      history,
    },

    push: (to: RouteLocationRaw) => navigate(to),
    replace: (to: RouteLocationRaw) => navigate(to, { replace: true }),
    go,
    back: () => go(-1),
    forward: () => go(1),

    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,

    onError: errorListeners.add,
    isReady,

    install(app) {
      app.component('RouterLink', RouterLink)
      app.component('RouterView', RouterView)

      app.config.globalProperties.$router = router
      Object.defineProperty(app.config.globalProperties, '$route', {
        enumerable: true,
        get: () => unref(currentRoute),
      })

      // this initial navigation is only necessary on client, on server it doesn't
      // make sense because it will create an extra unnecessary navigation and could
      // lead to problems
      if (
        isBrowser &&
        // used for the initial navigation client side to avoid pushing
        // multiple times when the router is used in multiple apps
        !started &&
        currentRoute.value === START_LOCATION_NORMALIZED
      ) {
        // see above
        started = true
        const initialLocation =
          window.location.pathname +
          window.location.search +
          window.location.hash
        navigate(initialLocation).catch(err => {
          if (__DEV__) warn('Unexpected error when starting the router:', err)
        })
      }

      const reactiveRoute = {} as RouteLocationNormalizedLoaded
      for (const key in START_LOCATION_NORMALIZED) {
        Object.defineProperty(reactiveRoute, key, {
          get: () => currentRoute.value[key as keyof RouteLocationNormalized],
          enumerable: true,
        })
      }

      app.provide(routerKey, router)
      app.provide(routeLocationKey, shallowReactive(reactiveRoute))
      app.provide(routerViewLocationKey, currentRoute)

      const unmountApp = app.unmount
      installedApps.add(app)
      app.unmount = function () {
        installedApps.delete(app)
        // the router is not attached to an app anymore
        if (installedApps.size < 1) {
          // invalidate the current navigation
          pendingLocation = START_LOCATION_NORMALIZED
          currentRoute.value = START_LOCATION_NORMALIZED
          started = false
          ready = false
        }
        unmountApp()
      }
    },
  }

  return router
}

function extractChangingRecords(
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded
) {
  const leavingRecords: RouteRecordNormalized[] = []
  const updatingRecords: RouteRecordNormalized[] = []
  const enteringRecords: RouteRecordNormalized[] = []

  const len = Math.max(from.matched.length, to.matched.length)
  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i]
    if (recordFrom) {
      if (to.matched.find(record => isSameRouteRecord(record, recordFrom)))
        updatingRecords.push(recordFrom)
      else leavingRecords.push(recordFrom)
    }
    const recordTo = to.matched[i]
    if (recordTo) {
      // the type doesn't matter because we are comparing per reference
      if (!from.matched.find(record => isSameRouteRecord(record, recordTo))) {
        enteringRecords.push(recordTo)
      }
    }
  }

  return [leavingRecords, updatingRecords, enteringRecords]
}
