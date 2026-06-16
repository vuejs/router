import { createConsoleReporter, defineDiagnostics } from 'nostics'
import type {
  RouteLocationAsPath,
  RouteLocationAsRelative,
  RouteLocationRaw,
} from './typed-routes/route-location'
import { stringifyRoute } from './errors'

/**
 * Runtime diagnostics catalog for Vue Router.
 *
 * Every entry has a stable `VUE_ROUTER_R####` code, a `why` that states the problem
 * (the diagnosis only, never the remedy) and a `fix` that states the remedy
 * (only, never the diagnosis). They are complementary: the reporter prints
 * both, so neither repeats the other. The diagnosis substrings asserted by the
 * warning tests stay in `why`. All call sites stay behind the existing `__DEV__` (or
 * `process.env.NODE_ENV !== 'production'`) guards and remain bare expression
 * statements so they tree-shake out of production builds.
 *
 * Codes are permanent: never rename or reuse one.
 * - `VUE_ROUTER_R0###` core runtime warnings
 * - `VUE_ROUTER_R1###` experimental data-loaders
 */
export const diagnostics = /*#__PURE__*/ defineDiagnostics({
  // docsBase: code => `https://router.vuejs.org/errors/${code.toLowerCase()}`,
  reporters: [/*#__PURE__*/ createConsoleReporter()],
  codes: {
    // --- router.ts ---
    VUE_ROUTER_R0001: {
      why: (p: { name: string }) =>
        `Parent route "${p.name}" not found when adding child route`,
      fix: 'Add the parent route before its children, or check the parent name for typos.',
      docs: 'https://router.vuejs.org/guide/advanced/dynamic-routing.html#Adding-nested-routes',
    },
    VUE_ROUTER_R0002: {
      why: (p: { name: string }) =>
        `Cannot remove non-existent route "${p.name}"`,
      fix: 'Check the route name; it may already have been removed or was never added.',
      docs: 'https://router.vuejs.org/guide/advanced/dynamic-routing.html#Removing-routes',
    },
    VUE_ROUTER_R0003: {
      why: (p: { location: RouteLocationRaw; href: string }) =>
        `Location "${stringifyRoute(p.location)}" resolved to "${p.href}". A resolved location cannot start with multiple slashes.`,
      fix: 'Remove the leading slashes from the location or fix the route configuration.',
    },
    VUE_ROUTER_R0004: {
      why: (p: { path: RouteLocationRaw }) =>
        `No match found for location with path "${stringifyRoute(p.path)}"`,
      fix: 'Add a route matching this path or check for typos in the location.',
      docs: 'https://router.vuejs.org/guide/essentials/dynamic-matching.html#Catch-all-404-Not-found-Route',
    },
    VUE_ROUTER_R0005: {
      why: (p: {
        rawLocation: string | RouteLocationAsRelative | RouteLocationAsPath
      }) =>
        `router.resolve() was passed an invalid location. This will fail in production.\nLocation: ${stringifyRoute(p.rawLocation)}`,
      fix: 'Pass a valid route location: a string path or an object with `path` or `name`.',
    },
    VUE_ROUTER_R0006: {
      why: (p: { path: string }) =>
        `Path "${p.path}" was passed with params but they will be ignored because a "path" was passed.`,
      fix: 'Use a named route `{ name, params }` instead of `{ path, params }`.',
      docs: 'https://router.vuejs.org/guide/essentials/navigation.html#Navigate-to-a-different-location',
    },
    VUE_ROUTER_R0007: {
      why: (p: { hash: string }) =>
        `A \`hash\` should always start with the character "#" but received "${p.hash}".`,
      fix: (p: { hash: string }) =>
        `Prepend "#" to the hash in your route location: use "#${p.hash}".`,
    },
    VUE_ROUTER_R0008: {
      why: (p: { target: string; to: string }) =>
        `Invalid redirect found:\n${p.target}\n when navigating to "${p.to}".\nThis will break in production.`,
      fix: 'A redirect must resolve to a location with a `name` or `path`; return one of those (or a string path) from `redirect`.',
      docs: 'https://router.vuejs.org/guide/essentials/redirect-and-alias.html#Redirect',
    },
    VUE_ROUTER_R0009: {
      why: (p: { from: string; to: string }) =>
        `Detected a possibly infinite redirection in a navigation guard when going from "${p.from}" to "${p.to}". Aborting to avoid a Stack Overflow. This might break in production if not fixed.`,
      fix: 'A guard is returning a new location on every call; make that return conditional so it only redirects when actually needed.',
      docs: 'https://router.vuejs.org/guide/advanced/navigation-guards.html#Global-Before-Guards',
    },
    VUE_ROUTER_R0010: {
      why: 'Uncaught error during route navigation',
      fix: 'Register an error handler with `router.onError()` to handle navigation errors.',
    },
    VUE_ROUTER_R0011: {
      why: 'Unexpected error when starting the router:',
      fix: 'Inspect the actual cause; a navigation guard or async component likely threw during the initial navigation.',
    },

    // --- navigationGuards.ts ---
    VUE_ROUTER_R0020: {
      why: (p: { fn: string }) =>
        `No active route record was found when calling \`${p.fn}()\`. ` +
        `Maybe you called it inside of App.vue?`,
      fix: 'Call it from a component rendered inside <router-view> (a page component or one of its children), not from App.vue.',
      docs: 'https://router.vuejs.org/guide/advanced/composition-api.html#Navigation-Guards',
    },
    VUE_ROUTER_R0021: {
      why:
        'No active route record was found when reactivating component with navigation guard. ' +
        'This is likely a bug in vue-router.',
      fix: 'Report with a minimal reproduction at https://github.com/vuejs/router/issues/new/choose.',
    },
    VUE_ROUTER_R0022: {
      why: (p: { fn: string }) =>
        `${p.fn}() was called outside of component setup but it must be called at the top of a setup function`,
      fix: 'Call it synchronously at the top of `setup()`, before any `await`.',
      docs: 'https://router.vuejs.org/guide/advanced/composition-api.html#Navigation-Guards',
    },
    VUE_ROUTER_R0023: {
      why: (p: { name: string; guard: string }) =>
        `The "next" callback was never called inside of ${
          p.name ? `"${p.name}"` : ''
        }:\n${p.guard}`,
      fix: 'Make sure `next()` runs on every branch, including early returns and async paths, or drop the `next` parameter and return the value instead.',
      docs: 'https://router.vuejs.org/guide/advanced/navigation-guards.html#Optional-third-argument-next',
    },
    VUE_ROUTER_R0024: {
      why: (p: { from: string; to: string }) =>
        `The "next" callback was called more than once in one navigation guard when going from "${p.from}" to "${p.to}". This will fail in production.`,
      fix: 'Call `next()` exactly once per guard: remove the extra call, or migrate to returning the value you passed to `next()`.',
      docs: 'https://router.vuejs.org/guide/advanced/navigation-guards.html#Optional-third-argument-next',
    },
    VUE_ROUTER_R0025: {
      why: 'The `next()` callback in navigation guards is deprecated.',
      fix: 'Return the value instead: `next()` becomes `return`, `next(false)` becomes `return false`, `next("/path")` becomes `return "/path"`.',
      docs: 'https://router.vuejs.org/guide/advanced/navigation-guards.html#Optional-third-argument-next',
    },
    VUE_ROUTER_R0026: {
      why: (p: { path: string }) =>
        `Record with path "${p.path}" is either missing a "component(s)"` +
        ` or "children" property.`,
      fix: 'Add a `component`, `components`, or `children` to the route record.',
      docs: 'https://router.vuejs.org/guide/essentials/nested-routes.html',
    },
    VUE_ROUTER_R0027: {
      why: (p: { name: string; path: string; received: string }) =>
        `Component "${p.name}" in record with path "${p.path}" is not` +
        ` a valid component. Received "${p.received}".`,
      fix: 'Pass a component or a function returning a Promise that resolves to one.',
    },
    VUE_ROUTER_R0028: {
      why: (p: { name: string; path: string }) =>
        `Component "${p.name}" in record with path "${p.path}" is a ` +
        `Promise instead of a function that returns a Promise. This will break in ` +
        `production if not fixed.`,
      fix: `Defer the import in an arrow function so it loads lazily: write "() => import('./MyPage.vue')", not "import('./MyPage.vue')".`,
      docs: 'https://router.vuejs.org/guide/advanced/lazy-loading.html',
    },
    VUE_ROUTER_R0029: {
      why: (p: { name: string; path: string }) =>
        `Component "${p.name}" in record with path "${p.path}" is defined ` +
        `using "defineAsyncComponent()".`,
      fix: `Drop the wrapper and pass "() => import('./MyPage.vue')" directly; the router handles lazy components itself.`,
      docs: 'https://router.vuejs.org/guide/advanced/lazy-loading.html#Relationship-to-async-components',
    },
    VUE_ROUTER_R0030: {
      why: (p: { name: string; path: string }) =>
        `Component "${p.name}" in record with path "${p.path}" is a function that does not return a Promise. This will break in production if not fixed.`,
      fix: 'Return a dynamic import (`() => import("./MyPage.vue")`) from the function, or add a `displayName` if it is a functional component.',
      docs: 'https://router.vuejs.org/guide/advanced/lazy-loading.html',
    },

    // --- scrollBehavior.ts ---
    VUE_ROUTER_R0040: {
      why: (p: { el: string }) =>
        `Because "${p.el}" starts with "#", scrollBehavior resolves it as an element id via document.getElementById("${p.el.slice(
          1
        )}"), not as a CSS selector. No element has that id, but "${p.el}" does match an element with document.querySelector().`,
      fix: (p: { el: string }) =>
        `Resolve the element yourself and return the node: el: document.querySelector('${p.el}').`,
      docs: 'https://router.vuejs.org/guide/advanced/scroll-behavior.html',
    },
    VUE_ROUTER_R0041: {
      why: (p: { el: string }) =>
        `The selector "${p.el}" is invalid. See https://mathiasbynens.be/notes/css-escapes or CSS.escape (https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape) for the escaping rules.`,
      fix: 'Build an id selector as `#${CSS.escape(id)}` so special characters in the id are escaped.',
      docs: 'https://router.vuejs.org/guide/advanced/scroll-behavior.html',
    },
    VUE_ROUTER_R0042: {
      why: (p: { el: string | Element }) =>
        `Couldn't find element using selector "${p.el}" returned by scrollBehavior.`,
      fix: 'Return a selector that matches an existing element, or guard against missing elements.',
      docs: 'https://router.vuejs.org/guide/advanced/scroll-behavior.html',
    },

    // --- RouterLink.ts ---
    VUE_ROUTER_R0050: {
      why: (p: { to: unknown }) => {
        let to: string
        try {
          to = p.to === undefined ? 'undefined' : JSON.stringify(p.to)
        } catch {
          to = String(p.to)
        }
        return `Invalid value for prop "to" in useLink()\n- to: ${to}`
      },
      fix: 'Pass a valid route location (a string path or an object) to the "to" prop.',
    },

    // --- RouterView.ts ---
    VUE_ROUTER_R0060: {
      why: (p: { comp: string }) =>
        `<router-view> can no longer be used directly inside <${p.comp}>.`,
      fix: (p: { comp: string }) =>
        `Wrap the slot's resolved component with <${p.comp}> instead of nesting <router-view> in it:\n\n` +
        `<router-view v-slot="{ Component }">\n` +
        `  <${p.comp}>\n` +
        `    <component :is="Component" />\n` +
        `  </${p.comp}>\n` +
        `</router-view>`,
      docs: 'https://router.vuejs.org/guide/advanced/router-view-slot.html#KeepAlive-Transition',
    },

    // --- location.ts ---
    VUE_ROUTER_R0070: {
      why: (p: { to: string; from: string }) =>
        `Cannot resolve a relative location without an absolute path. Trying to resolve "${p.to}" from "${p.from}".`,
      fix: (p: { from: string }) =>
        `Resolve from an absolute \`from\` path that starts with "/", e.g. "/${p.from}".`,
    },

    // --- encoding.ts ---
    VUE_ROUTER_R0080: {
      why: (p: { text: string }) =>
        `Error decoding "${p.text}". Using original value`,
      fix: 'Ensure the value is correctly percent-encoded.',
    },

    // --- matcher/pathMatcher.ts ---
    VUE_ROUTER_R0090: {
      why: (p: { name: string; path: string }) =>
        `Found duplicated params with name "${p.name}" for path "${p.path}". Only the last one will be available on "$route.params".`,
      fix: 'Give each param a unique name within the path.',
      docs: 'https://router.vuejs.org/guide/essentials/route-matching-syntax.html',
    },

    // --- matcher/index.ts ---
    VUE_ROUTER_R0100: {
      why: (p: { params: string; inherited: string }) =>
        `Discarded invalid param(s) "${p.params}" when navigating.` +
        p.inherited +
        ` See https://github.com/vuejs/router/commit/e887570 for more details.`,
      fix: 'Only pass params that exist on the target route.',
    },
    VUE_ROUTER_R0101: {
      why: (p: { path: string }) =>
        `The Matcher cannot resolve relative paths but received "${p.path}". Unless you directly called \`matcher.resolve("${p.path}")\`, this is probably a bug in vue-router. Please open an issue at https://github.com/vuejs/router/issues/new/choose.`,
      fix: 'Pass an absolute path (starting with "/") to the matcher.',
    },
    VUE_ROUTER_R0102: {
      why: (p: { alias: string; original: string; name: string }) =>
        `Alias "${p.alias}" and the original record: "${p.original}" must have the exact same param named "${p.name}"`,
      fix: 'Use the same param names in the alias as in the original route.',
      docs: 'https://router.vuejs.org/guide/essentials/redirect-and-alias.html#Alias',
    },
    VUE_ROUTER_R0103: {
      why: (p: { name: string }) =>
        `The route named "${p.name}" has a child without a name, an empty path, and no children. Using that name won't render the empty path child, so this is probably a mistake.`,
      fix: 'Move the `name` onto the empty-path child; or, if intentional, give the child its own name to silence this.',
      docs: 'https://router.vuejs.org/guide/essentials/nested-routes.html#Nested-Named-Routes',
    },
    VUE_ROUTER_R0104: {
      why: (p: { path: string; name: string; parent: string }) =>
        `Absolute path "${p.path}" must have the exact same param named "${p.name}" as its parent "${p.parent}".`,
      fix: 'Include the parent route params in the absolute child path.',
      docs: 'https://router.vuejs.org/guide/essentials/nested-routes.html',
    },
    VUE_ROUTER_R0105: {
      why: (p: { ancestor: string; record: string }) =>
        `Finding ancestor route "${p.ancestor}" failed for "${p.record}"`,
      fix: 'Report a reproduction at https://github.com/vuejs/router/issues/new/choose.',
    },

    // --- history/hash.ts ---
    VUE_ROUTER_R0110: {
      why: `A hash base must end with a "#"`,
      fix: (p: { base: string; suggestion: string }) =>
        `Append "#" to the "base" argument passed to "createWebHashHistory()": "${p.base}" should be "${p.suggestion}".`,
    },

    // --- history/html5.ts ---
    VUE_ROUTER_R0120: {
      why: 'Error with push/replace State',
      fix: 'The browser rejected the history API call; check for cross-origin or rate-limit issues.',
    },
    VUE_ROUTER_R0121: {
      why:
        `history.state seems to have been manually replaced without preserving the necessary values.\n` +
        `You can find more information at https://router.vuejs.org/guide/migration/#Usage-of-history-state`,
      fix: "Merge the router's state into your own when calling it manually: `history.replaceState({ ...history.state, ...yourState }, '', url)`.",
      docs: 'https://router.vuejs.org/guide/migration.html#Usage-of-history-state',
    },

    // --- experimental/data-loaders ---
    VUE_ROUTER_R1001: {
      why: (p: { key: string[] }) =>
        `Data loader [${p.key.join(',')}] has a different parent than the current context. This shouldn't be happening.`,
      fix: 'Report a bug with a minimal reproduction at https://github.com/vuejs/router/.',
    },
    VUE_ROUTER_R1002: {
      why: 'Returning a NavigationResult is deprecated.',
      fix: 'Replace `return new NavigationResult(to)` with `reroute(to)`, which throws internally to reroute.',
      docs: 'https://router.vuejs.org/data-loaders/navigation-aware.html#Controlling-the-navigation-with-reroute-',
    },
    VUE_ROUTER_R1003: {
      why: (p: { key: string | undefined }) =>
        `Loader "${p.key}"'s "commit()" was called but there is no staged data.`,
      fix: 'Ensure the loader resolved before calling `commit()`.',
      docs: 'https://router.vuejs.org/data-loaders/defining-loaders.html#Delaying-data-updates-with-commit',
    },
    VUE_ROUTER_R1004: {
      why: (p: { key: string }) =>
        'A loader returned a NavigationResult but is not registered on the route.' +
        p.key,
      fix: 'Export the loader from the page component so it gets registered, e.g. `export const useUserData = defineLoader(...)`.',
      docs: 'https://router.vuejs.org/data-loaders/organization.html',
    },
    VUE_ROUTER_R1005: {
      why: (p: { key: string | undefined }) =>
        `Data loader "${p.key}" has itself as parent. This shouldn't be happening.`,
      fix: 'Report a bug with a minimal reproduction at https://github.com/vuejs/router/.',
    },
    VUE_ROUTER_R1006: {
      why: (p: { key: string }) =>
        `A query was defined with the same key as the loader "[${p.key}]".\nSee https://pinia-colada.esm.dev/#TODO`,
      fix: 'If the key is meant to match, use the data loader directly; otherwise rename the `useQuery()` key so it no longer collides.',
      docs: 'https://router.vuejs.org/data-loaders/colada.html',
    },
    VUE_ROUTER_R1007: {
      why: 'Data Loader was setup twice.',
      fix: 'Register `DataLoaderPlugin` a single time via `app.use()`.',
      docs: 'https://router.vuejs.org/data-loaders.html#Installation',
    },
    VUE_ROUTER_R1008: {
      why: 'Data Loader is experimental and subject to breaking changes in the future.',
      docs: 'https://router.vuejs.org/data-loaders.html',
    },
    VUE_ROUTER_R1009: {
      why: 'Returning a NavigationResult from a loader is deprecated.',
      fix: 'Call `reroute(to)` inside the loader instead of returning `new NavigationResult(to)`; it throws internally to reroute.',
      docs: 'https://router.vuejs.org/data-loaders/navigation-aware.html#Controlling-the-navigation-with-reroute-',
    },
  },
})
