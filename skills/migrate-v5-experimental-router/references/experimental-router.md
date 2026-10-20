# Phase 2: Switch to the experimental router

Goal: replace `createRouter({ routes })` with `experimental_createRouter({ resolver })`. With file-based routing, the plugin generates the resolver in `vue-router/auto-resolver`. You do not need a plugin option for it.

Docs: `packages/docs/experimental/router-resolver.md`.

Before you start, remove every blocker from [limitations.md](limitations.md). The app must not call `addRoute()` or change `routes` at runtime.

## 1. Router file

```ts
// src/router.ts
import { createWebHistory } from 'vue-router'
import { experimental_createRouter } from 'vue-router/experimental'
import { resolver, handleHotUpdate } from 'vue-router/auto-resolver'

export const router = experimental_createRouter({
  history: createWebHistory(),
  resolver,
  // still supported: linkActiveClass, linkExactActiveClass
  // deprecated: scrollBehavior (see phase 4)
  // ignored: parseQuery, strict, sensitive, end
})

if (import.meta.hot) handleHotUpdate(router)
```

Options:

| Option                                    | Status in the experimental router                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `history`                                 | required. No dev error if missing, so check it.                              |
| `resolver`                                | required. Replaces `routes`.                                                 |
| `routes`                                  | not accepted                                                                 |
| `scrollBehavior`                          | works, but deprecated. Use `ScrollRestoration`.                              |
| `parseQuery`                              | **ignored**                                                                  |
| `stringifyQuery`                          | only used to detect duplicate navigations. `fullPath` uses the built-in one. |
| `linkActiveClass`, `linkExactActiveClass` | works                                                                        |
| `strict`, `sensitive`, `end`              | in the type, but ignored. Matchers decide. Paths match case-insensitively.   |

`handleHotUpdate` from `vue-router/auto-resolver` replaces the resolver and calls `router.replace()` on the current location. An optional second argument is a callback that receives the new resolver after each hot update.

## 2. `main.ts`

```ts
import { createApp } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { DataLoaderPlugin } from 'vue-router/experimental'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

// the experimental router does NOT register these
app.component('RouterLink', RouterLink)
app.component('RouterView', RouterView)

// plugins that take the router go BEFORE app.use(router)
app.use(DataLoaderPlugin, { router })
app.use(router)
app.mount('#app')

// typed useRouter()
declare module 'vue-router' {
  interface TypesConfig {
    Router: typeof router
  }
}
```

`DataLoaderPlugin` is typed for the stable `Router`. The playground passes `router as any` with a FIXME. If the type check fails there, use a cast and tell the user why.

Tests: if unit tests mount components with the router as a plugin, also register `RouterLink` and `RouterView` in the test setup (`global.components`).

## 3. Behavior changes to fix in app code

### Query values are arrays

Every key in `route.query` is an array. A key without a value gives `[null]`. A missing key is `undefined`.

```ts
// /search?q=vue&tag=a&tag=b&debug
route.query.q // ['vue']
route.query.tag // ['a', 'b']
route.query.debug // [null]
route.query.page // undefined
```

Fix reads: `route.query.q` to `route.query.q?.[0]`. Fix writes:

```ts
router.push({ query: { q: ['vue'] } }) // OK
router.push({ query: { q: 'vue' } }) // works, warns D0002
```

- `undefined` removes a key. An empty array is the same as a missing key.
- `parseQuery` is ignored. Move custom parsing to query params with parsers in `definePage()` (phase 3). Those values go to `route.params`, not `route.query`.
- In a hand-written `MatcherPatternQuery`, `query[key]` can be a string, `null`, an array, or `undefined`. Handle all shapes.

### Relative and named navigation

| Call                                    | Stable router                        | Experimental router                                     |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| `push('add')` on `/users/posva`         | `/users/add`                         | same                                                    |
| `push({ query: {...} })` (no name/path) | uses the current route               | **no current route**. Dev warning, crash in production. |
| `push({ params: {...} })` (no name)     | uses the current route               | same problem                                            |
| `push({ name: 'user' })` on `/users/1`  | keeps `id: 1` from the current route | **does not keep** params, query, or hash. Pass them.    |
| `push({ path: 'rel' })`                 | relative to current                  | relative to `/`                                         |

Fix relative object locations: resolve with the current route, then navigate.

```ts
const target = router.resolve(
  { query: { page: ['2'] } },
  router.currentRoute.value
)
router.push(target)
```

Fix named locations: pass every required param.

```ts
router.push({ name: '/users/[id]', params: { id: route.params.id } })
```

Check `<RouterLink :to="{ params: ... }">` and `useLink()` too. They call `router.resolve()` without the current route.

### Redirects

**Record redirects** (`definePage({ redirect })`) must return a name or an absolute path (`/...`). Relative redirects throw `R0008` in dev. They do not keep params, query, or hash. Copy them from `to`:

```ts
definePage({
  redirect: to => ({ path: '/search', query: to.query, hash: to.hash }),
})
```

**Guard redirects** (return value of `beforeEach`) can be relative. They resolve against the target route `to`. An object without `name` or `path` keeps the target params, query, and hash.

```ts
router.beforeEach(to => {
  if (to.path === '/search' && !to.query.page) {
    return { query: { page: ['2'] } } // /search?q=vue&page=2
  }
})
```

### `beforeEnter`

`beforeEnter` is not in the record type. It still runs, but it warns `D0001` once per record. Move the condition to `meta` and check it in a global guard:

```ts
// pages/admin.vue
definePage({ meta: { requiresAuth: true } })

// router.ts
router.beforeEach(to => {
  if (to.meta.requiresAuth && !isLoggedIn()) return '/login'
})
```

Type the meta field with `declare module 'vue-router' { interface RouteMeta { requiresAuth?: boolean } }`.

### `props`

Route-record `props` is not supported in the experimental router (TODO in `experimental/router.ts`). Remove `props: true` and read params in the component:

```vue
<script setup lang="ts">
const route = useRoute('/users/[id]')
const id = computed(() => route.params.id)
</script>
```

If the component is also used outside the router, keep its props and add a small page wrapper that passes `route.params` to it.

### Other changes

- **Optional params:** remove them with `null`, not `undefined` or `''` (`R0122`). Missing optional params read as `null`.
- **Hash:** `route.hash` is never decoded. It is encoded like `location.hash`.
- **`getRoutes()`** returns only matchable records (including alias records). Group records only appear as `parent`.
- **`hasRoute(name)`** still works. Alias records are not in the name map.
- **Unknown name:** `push({ name: 'x' })` with an unknown name throws `Record "x" not found` in dev.
- **Nesting:** records have `parent`, not `children`. Code that walks `route.matched[i].children` must change.
- **Meta:** `route.meta` merges the meta of all matched records, including group records.
- **Unchanged:** in-component guards (`onBeforeRouteLeave`, `onBeforeRouteUpdate`, `beforeRouteEnter`), global guards, `isReady()`, `onError()`, `go()/back()/forward()`, `<KeepAlive>` and `<Transition>` inside `<RouterView>`, named views.

## 4. Check phase 2

- The type check passes with the `TypesConfig.Router` augmentation.
- No `D0001`, `D0002`, `R0008`, or `R0122` warnings in the console.
- Every relative `push({ query })` / `push({ params })` now passes the current route.
- Back/forward and redirects work.
