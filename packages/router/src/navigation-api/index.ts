import type { App } from 'vue'
import { shallowReactive, shallowRef, unref } from 'vue'
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
import { TransitionMode, transitionModeKey } from '../transition'
import { isChangingPage } from '../utils/routes'

/**
 * Options for {@link createNavigationApiRouter}.
 *
 * This function creates an "opinionated" router that provides smart, modern
 * defaults for features like scroll restoration, focus management, and View
 * Transitions, aiming to deliver a best-in-class, accessible user experience
 * out of the box with zero configuration.
 *
 * It differs from the legacy `createRouter`, which acts more like a library by
 * providing the tools (`scrollBehavior`) but leaving the implementation of these
 * features to the developer.
 *
 * While this router provides smart defaults, it also allows for full customization
 * by providing your own `scroll behavior` function or fine-tuning focus management,
 * giving you the best of both worlds.
 */
export interface RouterApiOptions
  extends Omit<RouterOptions, 'history' | 'scrollBehavior'> {
  base?: string
  location: string
  /**
   * Focus management.
   *
   * This can be overridden per route by passing `focusManagement` in the route meta, will take precedence over this option.
   *
   * If `undefined`, the router will not manage focus: will use the [default behavior](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/intercept#focusreset).
   *
   * If `true`, the router will focus the first element in the dom using `document.querySelector('[autofocus], h1, main, body')`.
   *
   * If `false`, the router and the browser will not manage the focus, the consumer should manage the focus in the router guards or target page components.
   *
   * If a `string`, the router will use `document.querySelector(focusManagement)` to find the element to be focused, if the element is not found, then it will try to find the element using the selector when the option is `true`.
   *
   * @default undefined
   */
  focusManagement?: boolean | string
  /**
   * Controls the scroll management strategy, allowing you to opt-into the
   * manual `vue-router` `scrollBehavior` system for fine-grained control
   * via [NavigateEvent.scroll](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/scroll)
   * in your route guards.
   *
   * This can be overridden per-route by defining a `scrollManagement` in the
   * route's `meta` field. This takes precedence over this option.
   *
   * The default behavior is to leverage the browser's native scroll handling:
   * - `undefined` (default) or `after-transition`: The router leverages the
   * browser's built-in, performant scroll handling (`scroll: 'after-transition'`).
   * This provides an excellent default experience that respects modern CSS
   * properties like `scroll-padding-top` and restores scroll position automatically
   * on back/forward navigations.
   * - `manual`: Disables the browser's native scroll management (`scroll: 'manual'`)
   * and enables using scroll via native [NavigateEvent.scroll](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/scroll) in your route guards.
   *
   * @default undefined
   */
  scrollManagement?: 'after-transition' | 'manual'
}

export function createNavigationApiRouter(
  options: RouterApiOptions,
  transitionMode: TransitionMode = 'auto'
): Router {
  if (typeof window === 'undefined' || !window.navigation) {
    throw new Error('Navigation API is not supported in this environment.')
  }
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
  let focusTimeoutId: ReturnType<typeof setTimeout> | undefined
  let lastSuccessfulLocation: RouteLocationNormalizedLoaded =
    START_LOCATION_NORMALIZED

  let started: boolean | undefined
  const installedApps = new Set<App>()

  function checkCanceledNavigation(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ): NavigationFailure | undefined {
    if (pendingLocation !== to) {
      return createRouterError<NavigationFailure>(
        ErrorTypes.NAVIGATION_CANCELLED,
        {
          from,
          to,
        }
      )
    }

    return undefined
  }

  function checkCanceledNavigationAndReject(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
  ) {
    const error = checkCanceledNavigation(to, from)
    if (error) throw error
  }

  function runWithContext<T>(fn: () => T): T {
    const app: App | undefined = installedApps.values().next().value
    // support Vue < 3.3
    return app && typeof app.runWithContext === 'function'
      ? app.runWithContext(fn)
      : fn()
  }

  // TODO: type this as NavigationGuardReturn or similar instead of any
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

    // run the queue of per route beforeRouteLeave guards
    let guards = extractComponentsGuards(
      leavingRecords.reverse(),
      'beforeRouteLeave',
      to,
      from,
      undefined,
      navigationInfo
    )

    // leavingRecords is already reversed
    for (const record of leavingRecords) {
      record.leaveGuards.forEach(guard => {
        guards.push(guardToPromiseFn(guard, to, from, { info: navigationInfo }))
      })
    }

    const canceledNavigationCheck = async () => {
      checkCanceledNavigationAndReject(to, from)
    }

    guards.push(canceledNavigationCheck)
    await runGuardQueue(guards)

    // check global guards beforeEach
    guards = []
    for (const guard of beforeGuards.list()) {
      guards.push(guardToPromiseFn(guard, to, from, { info: navigationInfo }))
    }
    guards.push(canceledNavigationCheck)
    await runGuardQueue(guards)

    // check in components beforeRouteUpdate
    guards = extractComponentsGuards(
      updatingRecords,
      'beforeRouteUpdate',
      to,
      from,
      undefined,
      navigationInfo
    )
    guards.push(canceledNavigationCheck)
    await runGuardQueue(guards)

    // check the route beforeEnter
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
    guards.push(canceledNavigationCheck)
    await runGuardQueue(guards)

    // NOTE: at this point to.matched is normalized and does not contain any () => Promise<Component>
    // clear existing enterCallbacks, these are added by extractComponentsGuards
    to.matched.forEach(record => (record.enterCallbacks = {}))

    // Resolve async components and run beforeRouteEnter
    guards = extractComponentsGuards(
      enteringRecords,
      'beforeRouteEnter',
      to,
      from,
      runWithContext,
      navigationInfo
    )
    guards.push(canceledNavigationCheck)
    await runGuardQueue(guards)

    // check global guards beforeResolve
    guards = []
    for (const guard of beforeResolveGuards.list()) {
      guards.push(guardToPromiseFn(guard, to, from, { info: navigationInfo }))
    }
    guards.push(canceledNavigationCheck)
    await runGuardQueue(guards)
  }

  interface FinalizeNavigationOptions {
    failure?: NavigationFailure
    focus?: {
      focusReset: 'after-transition' | 'manual'
      selector?: string
    }
  }

  function finalizeNavigation(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    options: FinalizeNavigationOptions = {}
  ) {
    pendingLocation = undefined
    const { failure, focus } = options
    if (!failure) {
      lastSuccessfulLocation = to
    }
    currentRoute.value = to as RouteLocationNormalizedLoaded
    markAsReady()
    afterGuards.list().forEach(guard => guard(to, from, failure))

    if (!failure && focus) {
      const { focusReset, selector } = focus
      // We only need to handle focus here, to prevent scrolling.
      // When focusManagement is false, selector is undefined.
      // So we can have the following cases:
      // - focusReset: after-transition -> default browser behavior: no action required here
      // - focusReset: manual, selector undefined -> no action required here
      // - focusReset: manual, selector with value -> prevent scrolling when focusing the target selector element
      // We don't need to handle scroll here, the browser or user guards or components lifecycle hooks will handle it
      if (focusReset === 'manual' && selector) {
        clearTimeout(focusTimeoutId)
        requestAnimationFrame(() => {
          focusTimeoutId = setTimeout(() => {
            const target = document.querySelector<HTMLElement>(selector)
            if (!target) return
            target.focus({ preventScroll: true })
            if (document.activeElement === target) return
            // element has tabindex already, likely not focusable
            // because of some other reason, bail out
            if (target.hasAttribute('tabindex')) return
            const restoreTabindex = () => {
              target.removeAttribute('tabindex')
              target.removeEventListener('blur', restoreTabindex)
            }
            // temporarily make the target element focusable
            target.setAttribute('tabindex', '-1')
            target.addEventListener('blur', restoreTabindex)
            // try to focus again
            target.focus({ preventScroll: true })
            // remove tabindex and event listener if focus still not worked
            if (document.activeElement !== target) restoreTabindex()
          }, 0)
        })
      }
    }
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
    from: RouteLocationNormalizedLoaded,
    silent = false
  ): Promise<unknown> {
    markAsReady(error)
    const list = errorListeners.list()
    if (list.length) {
      list.forEach(handler => handler(error, to, from))
    } else if (!silent) {
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
      finalizeNavigation(from, from, { failure })
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

  function prepareTargetLocation(
    event: NavigateEvent
  ): RouteLocationNormalized {
    if (!pendingLocation) {
      const destination = new URL(event.destination.url)
      const pathWithSearchAndHash =
        destination.pathname + destination.search + destination.hash
      return resolve(pathWithSearchAndHash) as RouteLocationNormalized
    }

    return pendingLocation as RouteLocationNormalized
  }

  function prepareFocusReset(to: RouteLocationNormalized) {
    let focusReset: 'after-transition' | 'manual' = 'after-transition'
    let selector: string | undefined

    const focusManagement = to.meta.focusManagement ?? options.focusManagement
    if (focusManagement === false) {
      focusReset = 'manual'
    }
    if (focusManagement === true) {
      focusReset = 'manual'
      selector = '[autofocus],h1,main,body'
    } else if (typeof focusManagement === 'string') {
      focusReset = 'manual'
      selector = focusManagement || '[autofocus],h1,main,body'
    }

    return [focusReset, selector] as const
  }

  function prepareScrollManagement(
    to: RouteLocationNormalized
  ): 'after-transition' | 'manual' {
    let scrollManagement: 'after-transition' | 'manual' = 'after-transition'
    const scrollMeta = to.meta.scrollManagement ?? options.scrollManagement
    if (scrollMeta === 'manual') {
      scrollManagement = 'manual'
    }

    return scrollManagement
  }

  async function handleNavigate(event: NavigateEvent) {
    clearTimeout(focusTimeoutId)

    // won't handle here 'traverse' navigations to avoid race conditions, see handleCurrentEntryChange
    if (!event.canIntercept || event.navigationType === 'traverse') {
      return
    }

    const targetLocation = prepareTargetLocation(event)
    const from = currentRoute.value

    // the calculation should be here, if running this logic inside the intercept handler
    // the back and forward buttons cannot be detected properly since the currentEntry
    // is already updated when the handler is executed.
    let navigationInfo: NavigationInformation | undefined
    if (event.navigationType === 'push' || event.navigationType === 'replace') {
      navigationInfo = {
        type:
          event.navigationType === 'push'
            ? NavigationType.push
            : NavigationType.pop,
        direction: NavigationDirection.unknown, // No specific direction for push/replace.
        delta: event.navigationType === 'push' ? 1 : 0,
        navigationApiEvent: event,
      }
    }

    const [focusReset, focusSelector] = prepareFocusReset(targetLocation)

    event.intercept({
      focusReset,
      scroll: prepareScrollManagement(targetLocation),
      async handler() {
        if (!pendingLocation) {
          pendingLocation = targetLocation
        }

        const to = pendingLocation as RouteLocationNormalized

        if (
          from !== START_LOCATION_NORMALIZED &&
          !(to as RouteLocationOptions).force &&
          isSameRouteLocation(stringifyQuery, from, to)
        ) {
          return
        }

        try {
          await resolveNavigationGuards(to, from, navigationInfo)
          finalizeNavigation(to, from, {
            focus: {
              focusReset,
              selector: focusSelector,
            },
          })
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
        } finally {
          // update always, we'll have some race condition it the user clicks 2 links
          pendingLocation = undefined
        }
      },
    })
  }

  async function handleCurrentEntryChange(
    event: NavigationCurrentEntryChangeEvent
  ) {
    clearTimeout(focusTimeoutId)
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
      isBackBrowserButton: delta < 0,
      isForwardBrowserButton: delta > 0,
    }

    const [focusReset, focusSelector] = prepareFocusReset(to)

    pendingLocation = to

    try {
      // then browser has been done the navigation, we just run the guards
      await resolveNavigationGuards(to, from, navigationInfo)
      finalizeNavigation(to, from, {
        focus: { focusReset, selector: focusSelector },
      })
    } catch (error) {
      const failure = error as NavigationFailure

      isRevertingNavigation = true
      go(event.from.index - window.navigation.currentEntry!.index)

      // we end up at from to keep consistency
      finalizeNavigation(from, to, { failure })

      if (isNavigationFailure(failure, ErrorTypes.NAVIGATION_GUARD_REDIRECT)) {
        navigate((failure as NavigationRedirectError).to, { replace: true })
      } else if (
        !isNavigationFailure(failure, ErrorTypes.NAVIGATION_CANCELLED)
      ) {
        // just ignore errors caused by the cancellation of the navigation
        triggerError(failure, to, from, true).catch(() => {})
      }
    } finally {
      // update always, we'll have some race condition it the user clicks 2 links
      pendingLocation = undefined
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

  let beforeResolveTransitionGuard: (() => void) | undefined
  let afterEachTransitionGuard: (() => void) | undefined
  let onErrorTransitionGuard: (() => void) | undefined

  function cleanupNativeViewTransition() {
    beforeResolveTransitionGuard?.()
    afterEachTransitionGuard?.()
    onErrorTransitionGuard?.()
  }

  const router: Router = {
    name: 'navigation-api',
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

    enableViewTransition(options) {
      cleanupNativeViewTransition()

      if (typeof document === 'undefined' || !document.startViewTransition) {
        return
      }

      if (transitionMode !== 'view-transition') {
        if (__DEV__) {
          console.warn('Native View Transition is disabled in auto mode.')
        }
        return
      }

      const defaultTransitionSetting = options.defaultViewTransition ?? true

      let finishTransition: (() => void) | undefined
      let abortTransition: (() => void) | undefined

      const resetTransitionState = () => {
        finishTransition = undefined
        abortTransition = undefined
      }

      beforeResolveTransitionGuard = this.beforeResolve(
        async (to, from, next) => {
          const transitionMode =
            to.meta.viewTransition ?? defaultTransitionSetting
          if (
            transitionMode === false ||
            (transitionMode !== 'always' &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
            !isChangingPage(to, from)
          ) {
            next(true)
            return
          }

          const promise = new Promise<void>((resolve, reject) => {
            finishTransition = resolve
            abortTransition = reject
          })

          const transition = document.startViewTransition(() => promise)

          await options.onStart?.(transition)
          transition.finished
            .then(() => options.onFinished?.(transition))
            .catch(() => options.onAborted?.(transition))
            .finally(resetTransitionState)

          next(true)
        }
      )

      afterEachTransitionGuard = this.afterEach(() => {
        finishTransition?.()
      })

      onErrorTransitionGuard = this.onError((error, to, from) => {
        abortTransition?.()
        resetTransitionState()
      })
    },

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
      app.provide(transitionModeKey, transitionMode)

      const unmountApp = app.unmount
      installedApps.add(app)
      app.unmount = function () {
        installedApps.delete(app)
        // the router is not attached to an app anymore
        if (installedApps.size < 1) {
          // invalidate the current navigation
          pendingLocation = START_LOCATION_NORMALIZED
          currentRoute.value = START_LOCATION_NORMALIZED
          cleanupNativeViewTransition()
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
