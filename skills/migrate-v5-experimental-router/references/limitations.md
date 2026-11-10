# Limitations of the experimental router

These features are not implemented, deprecated, or partially working. Each item gives a workaround. If no workaround fits the app, stop and tell the user. Do not patch `node_modules` and do not invent APIs.

Before you claim one of these is fixed, check the current source: `packages/router/src/experimental/router.ts`, `packages/router/src/unplugin/codegen/generateRouteResolver.ts`, and the `it.todo` / `it.skip` / `describe.todo` tests next to them.

## Dynamic routing

**Status:** not implemented. The experimental router has no `addRoute()`, `removeRoute()`, or `clearRoutes()`. The resolver is fixed at creation. The tests are in `describe.todo('Dynamic Routing')` in `experimental/router.spec.ts`.

What breaks:

- `router.addRoute(...)` for permission-based routes or plugin routes.
- `setupLayouts(routes)` (vite-plugin-vue-layouts) and other functions that change the `routes` array.
- `routes.push({ path, redirect })` for runtime redirects.
- `handleHotUpdate(router, cb)` callbacks that re-add routes.

Workarounds:

| Use case                    | Workaround                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Layouts                     | `_parent.vue` or a sibling `name.vue` with `<RouterView>`. For a layout without a URL segment, use a `(group)/_parent.vue`. |
| Runtime redirects           | A page file with `definePage({ redirect: '/target' })`. Or a `beforeEach` guard that returns the target.                    |
| Permission-based routes     | Declare all routes. Add `meta` (`definePage({ meta: { roles: ['admin'] } })`) and reject in `beforeEach`.                   |
| Routes from a plugin/module | `beforeWriteFiles(root)` with `root.insert(path, file)` in the Vite plugin options (build time).                            |
| Extra aliases               | `definePage({ alias: ['/abs/path'] })` or `extendRoute(route)` with `route.addAlias()`. Aliases must be absolute.           |
| Many apps sharing routes    | Create the resolver per app with `createFixedResolver()` ([fixed-resolver.md](fixed-resolver.md)).                          |

If the app truly needs routes that are only known at runtime (CMS pages), keep the stable router. Or add one catch-all page that loads content from the path.

## `beforeEnter`

**Status:** deprecated. Not in the record type. It still runs, with dev warning `D0001`.

Workaround: `meta` + `router.beforeEach()`. See [experimental-router.md](experimental-router.md#beforeenter).

## `props` on route records

**Status:** not implemented (TODO in the record type). `props: true` in `definePage()` does not pass params as props.

Workaround: read `useRoute().params` in the page. Keep reusable components prop-based and add a thin page wrapper.

## `path` override in `definePage()`, `<route>`, or `extendRoute`

**Status:** broken in the resolver codegen. The matcher regexp is built from the file name, not from the override. The tests are `it.todo` with a FIXME. No warning is shown.

Workaround: rename the file (use `.` for flat segments, `(group)` folders, `[param]`). Or add the path as an absolute `alias`.

## Custom `parseQuery`

**Status:** ignored. `route.query` values are always `(string | null)[]`. `stringifyQuery` is only used to detect duplicate navigations.

Workaround: query params with parsers in `definePage({ params: { query } })`. They appear in `route.params`.

## `<route>` block `props` and `redirect`

**Status:** only emitted for `vue-router/auto-routes`. The resolver ignores them.

Workaround: use `definePage({ redirect })`. For props, see above.

## Relative object locations

**Status:** by design. `router.push({ query })`, `{ params }`, and `<RouterLink :to="{ query }">` without `name` or `path` do not use the current route. They warn in dev and crash in production.

Workaround: `router.resolve(location, router.currentRoute.value)`, then push the result. Or pass `name` and all params.

## Named locations do not keep current params

**Status:** by design. `push({ name })` does not copy params, query, or hash from the current route.

Workaround: pass every required param.

## Relative record redirects

**Status:** by design. Record redirects must be named or absolute (`R0008`) and do not keep params, query, or hash.

Workaround: return `{ path: '/x', query: to.query, hash: to.hash }`.

## Other gaps

- `queryKey` (a query key different from the param name) is not configurable in `definePage()`.
- Trailing slash handling is limited: static paths do not match with a trailing slash. Paths that end with a splat accept both.
- `RouterLink`, `RouterView` are not registered by `install()`.
- `DataLoaderPlugin` is typed for the stable `Router`. A cast may be necessary.
- `MatcherPatternPathStar` and `PARAM_PARSER_STRING` exist in the source but are not exported.
- Some errors are plain `warn()` strings, not diagnostics: "No match found for location with path ...", "Infinite redirect in navigation guard", `Record "x" not found`.
- Standard Schema parsers are one-way and sync only.
- HMR for routes only works with Vite.
