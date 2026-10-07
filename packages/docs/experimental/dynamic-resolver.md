# Dynamic Resolver

::: warning
The experimental router reflects the explorations of the upcoming major version of Vue Router. It is not production-ready and should be used for testing and feedback purposes only.
:::

The resolver from `vue-router/auto-resolver` is **fixed**: all the routes are known at build time. If your application also adds or removes routes at runtime (plugins, permissions, routes that come from an API), use the **dynamic resolver** instead. It adds `addRoute()`, `removeRoute()`, and `clearRoutes()` to the router.

## With file-based routing

Import the resolver from `vue-router/auto-resolver?dynamic` instead of `vue-router/auto-resolver`. It contains the same routes, generated at build time:

```ts
import { createWebHistory } from 'vue-router'
import { experimental_createRouter as createRouter } from 'vue-router/experimental'
import { resolver, handleHotUpdate } from 'vue-router/auto-resolver' // [!code --]
import { resolver, handleHotUpdate } from 'vue-router/auto-resolver?dynamic' // [!code ++]

export const router = createRouter({
  history: createWebHistory(),
  resolver,
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
```

During HMR, the generated routes are replaced and the routes that you added with `addRoute()` are kept.

## Migrate from `createRouter()`

Pass your existing `routes` array to `createDynamicResolver()`:

```ts
import { createWebHistory } from 'vue-router'
// [!code --]
import { createRouter } from 'vue-router'
// [!code ++:4]
import {
  experimental_createRouter as createRouter,
  createDynamicResolver,
} from 'vue-router/experimental'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes, // [!code --]
  resolver: createDynamicResolver(routes), // [!code ++]
})
```

Like the rest of the experimental router, `<RouterLink>` and `<RouterView>` are not registered globally. See [Installation](./router-resolver.md#installation).

The route records keep the [same syntax](../guide/essentials/route-matching-syntax.md): `path` with params (`/users/:id(\\d+)`, `/:pathMatch(.*)*`), `children`, `alias`, `component` or `components`, `props`, `redirect`, and `meta`. The paths are converted to the same patterns as the generated routes. The dynamic resolver also accepts the generated records, so you can mix both kinds in the array and in `addRoute()`.

## Add and remove routes

The router has the same methods as before:

```ts
const removeRoute = router.addRoute({
  path: '/admin',
  name: 'admin',
  component: AdminPage,
})
// add a child route
router.addRoute('admin', { path: 'settings', component: AdminSettings })

router.hasRoute('admin') // true
router.removeRoute('admin') // also removes its children and aliases
removeRoute() // same as above
router.clearRoutes()
```

These methods come from the resolver: the router exposes all the resolver methods that it does not define itself. With a fixed resolver, the router does not have them. You can also call them on the resolver, e.g. to add routes before you create the router:

```ts
const resolver = createDynamicResolver()
resolver.addRoute({ path: '/', component: Home })
```

A child route can be added to a generated route. Its params use the same param parsers as the parent route.

Adding a route does not change the current location. If the current location must match the new route, navigate again (e.g. `router.replace(router.currentRoute.value.fullPath)`), or return the new location from a navigation guard.

`router.resolve()` tracks the routes: a `computed()` that calls `router.resolve()` updates when a route is added or removed.

## Ranking

The routes are ranked with the same score as the generated routes: static parts rank first, then params, then optional and repeatable params, then splats like `/:pathMatch(.*)*`. A child ranks before its parent when both match the same paths. Routes with the same score keep the order in which they were added.

A custom regexp does not change the rank: `/:id(\\d+)` does not rank before `/:slug` by itself. Add the route with the more specific regexp first.

## Differences with `createRouter()`

The dynamic resolver uses the experimental router, so the differences of the [experimental router](./router-resolver.md) also apply (e.g. [query values are arrays](./router-resolver.md#query-values-are-arrays), and [redirects](./router-resolver.md#route-record-redirects) must be absolute or named). These differences are specific to the route records:

| Classic router                                           | Dynamic resolver                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `/about` also matches `/about/`                          | Paths are strict: `/about` does not match `/about/`                       |
| `strict`, `sensitive`, and `end` options                 | Not supported: paths are strict and case insensitive                      |
| A custom regexp ranks a param higher                     | Only the kind of param changes the rank                                   |
| A `(.*)` param encodes its slashes                       | A `(.*)` param is a splat: its slashes are not encoded                    |
| A missing optional param is absent from `params`         | A missing optional param is `null`                                        |
| A missing repeatable optional param is absent            | A repeatable param is always an array (`[]` when missing)                 |
| An unnamed route has `name: undefined`                   | An unnamed route has a generated `Symbol` name                            |
| A location without a match has `name: undefined`         | A location without a match has a `Symbol` name and empty `matched`        |
| An optional param passed as `''` stays `''`              | It becomes `null` and warns in development (use `null`)                   |
| A repeatable param passed as a string stays a string     | It becomes an array                                                       |
| Records have `children`                                  | Records have `parent`. `record.path` is a pattern object                  |
| Named locations reuse the params of the current route    | Pass all the required params                                              |
| A missing required param throws `Missing required param` | It throws a match error and warns `Missing required param` in development |
| `beforeEnter` is supported                               | `beforeEnter` runs but is deprecated                                      |

::: tip
If all your routes are known at build time, prefer the fixed resolver from `vue-router/auto-resolver`: it is smaller.
:::
