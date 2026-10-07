# Dynamic Resolver

::: warning
The experimental router reflects the explorations of the upcoming major version of Vue Router. It is not production-ready and should be used for testing and feedback purposes only.
:::

The resolver from `vue-router/auto-resolver` is **fixed**: all the routes are known at build time. If your application adds or removes routes at runtime (plugins, permissions, routes that come from an API), use the **dynamic resolver** instead. It accepts the same route records as `createRouter({ routes })`, and it adds `addRoute()`, `removeRoute()`, and `clearRoutes()` to the router.

## Migrate from `createRouter()`

Pass your existing `routes` array to `createDynamicResolver()`:

```ts
import { createWebHistory } from 'vue-router'
import { createRouter } from 'vue-router' // [!code --]
import {
  // [!code ++]
  experimental_createRouter as createRouter, // [!code ++]
  createDynamicResolver, // [!code ++]
} from 'vue-router/experimental' // [!code ++]
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes, // [!code --]
  resolver: createDynamicResolver(routes), // [!code ++]
})
```

Like the rest of the experimental router, `<RouterLink>` and `<RouterView>` are not registered globally. See [Installation](./router-resolver.md#installation).

The route records keep the [same syntax](../guide/essentials/route-matching-syntax.md): `path` with params (`/users/:id(\\d+)`, `/:pathMatch(.*)*`), `children`, `alias`, `component` or `components`, `props`, `redirect`, `meta`, `strict`, `sensitive`, and `end`. Routes are ranked the same way as in `createRouter()`.

The path options that you passed to `createRouter()` now go to the resolver:

```ts
createRouter({
  history: createWebHistory(),
  strict: true, // [!code --]
  resolver: createDynamicResolver(routes, { strict: true }), // [!code ++]
})
```

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

The resolver also has these methods, so you can create the routes before you create the router:

```ts
const resolver = createDynamicResolver()
resolver.addRoute({ path: '/', component: Home })
```

Adding a route does not change the current location. If the current location must match the new route, navigate again (e.g. `router.replace(router.currentRoute.value.fullPath)`), or return the new location from a navigation guard.

`router.resolve()` tracks the routes: a `computed()` that calls `router.resolve()` updates when a route is added or removed.

## Differences with `createRouter()`

The dynamic resolver uses the experimental router, so the differences of the [experimental router](./router-resolver.md) also apply (e.g. [query values are arrays](./router-resolver.md#query-values-are-arrays), and [redirects](./router-resolver.md#route-record-redirects) must be absolute or named). These differences are specific to the route records:

| Classic router                                        | Dynamic resolver                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| A missing optional param is absent from `params`      | A missing optional param is `null`                                 |
| A missing repeatable optional param is absent         | A repeatable param is always an array (`[]` when missing)          |
| An unnamed route has `name: undefined`                | An unnamed route has a generated `Symbol` name                     |
| A location without a match has `name: undefined`      | A location without a match has a `Symbol` name and empty `matched` |
| An optional param passed as `''` stays `''`           | It becomes `null`                                                  |
| A repeatable param passed as a string stays a string  | It becomes an array                                                |
| Records have `children`                               | Records have `parent`. `record.path` is a pattern object           |
| Named locations reuse the params of the current route | Pass all the required params                                       |
| `beforeEnter` is supported                            | `beforeEnter` runs but is deprecated                               |

To find the original path of a record, use `record.path.path`:

```ts
router.getRoutes().map(record => record.path.path)
```

::: tip
If all your routes are known at build time, prefer [file-based routing](../file-based-routing/) with the fixed resolver from `vue-router/auto-resolver`: it is smaller and has better types.
:::
