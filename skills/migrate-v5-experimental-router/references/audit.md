# Phase 0: Audit the app

Find what the app uses before you change code. Write the results as a short list for the user. Mark each item as **OK**, **needs change**, or **blocker**.

## 1. Versions and setup

- `vue-router` must be `>=5`. Check `package.json` and the lockfile.
- `unplugin-vue-router` must be removed. Its imports move to `vue-router/vite`, `vue-router/unplugin`, `vue-router/auto-routes`, `vue-router/experimental`. See `packages/docs/guide/migration/v4-to-v5.md`.
- Find the bundler: Vite, webpack, Rollup, esbuild, Rspack. HMR for routes only works with Vite.
- Find the package manager from the lockfile.

## 2. Search commands

Run these from the app root. Exclude `node_modules` and build output.

```sh
# router creation and options
rg -n "createRouter\(|experimental_createRouter\(" src
rg -n "scrollBehavior|parseQuery|stringifyQuery|linkActiveClass|strict:|sensitive:" src

# dynamic routing: BLOCKER for phase 2
rg -n "\.addRoute\(|\.removeRoute\(|\.clearRoutes\(|\.hasRoute\(|\.getRoutes\(" src
rg -n "setupLayouts|routes\.push\(|routes\.unshift\(" src

# record features that change
rg -n "beforeEnter" src
rg -n "props:\s*(true|\{|\()" src
rg -n "alias:" src
rg -n "redirect:" src
rg -n "children:" src

# param patterns: candidates for param parsers
rg -n "path:\s*['\"\`][^'\"\`]*:\w+\(" src          # custom regexp like :id(\\d+)
rg -n "Number\(route\.params|parseInt\(route\.params|route\.params\.\w+ as" src
rg -n "route\.query\.\w+" src

# navigation that changes meaning
rg -n "push\(\{\s*(params|query|hash):" src         # relative object locations
rg -n "push\(\{\s*name:" src                        # named locations
rg -n "query:\s*\{" src

# in-component guards and meta
rg -n "onBeforeRouteLeave|onBeforeRouteUpdate|beforeRouteEnter|beforeRouteLeave|beforeRouteUpdate" src
rg -n "\.meta\.\w+" src
```

## 3. Classify the findings

| Finding                                        | Status                          | Where to fix                                                                   |
| ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `addRoute` / `removeRoute` / `clearRoutes`     | blocker for phase 2             | [limitations.md](limitations.md#dynamic-routing)                               |
| `setupLayouts(routes)` or `routes.push(...)`   | blocker for phase 2             | [limitations.md](limitations.md#dynamic-routing)                               |
| `beforeEnter`                                  | needs change in phase 2         | [experimental-router.md](experimental-router.md#beforeenter)                   |
| `props` on records                             | needs change in phase 2         | [experimental-router.md](experimental-router.md#props)                         |
| `parseQuery` / `stringifyQuery`                | needs change in phase 2         | [experimental-router.md](experimental-router.md#query-values-are-arrays)       |
| `route.query.x` read as a string               | needs change in phase 2         | [experimental-router.md](experimental-router.md#query-values-are-arrays)       |
| `push({ params })` without `name`              | needs change in phase 2         | [experimental-router.md](experimental-router.md#relative-and-named-navigation) |
| `push({ name })` that relies on current params | needs change in phase 2         | [experimental-router.md](experimental-router.md#relative-and-named-navigation) |
| relative `redirect` on a record                | needs change in phase 2         | [experimental-router.md](experimental-router.md#redirects)                     |
| `:id(\\d+)` or `Number(route.params.id)`       | optional, phase 3               | [param-parsers.md](param-parsers.md)                                           |
| `scrollBehavior`                               | optional, phase 4               | [scroll-restoration.md](scroll-restoration.md)                                 |
| `children`, `alias`, named views, `meta`       | OK, file conventions cover them | [file-based-routing.md](file-based-routing.md)                                 |
| in-component guards                            | OK, they still run              |                                                                                |

## 4. Make a route map

Write a table of every record: full path, name, component file, params, meta, redirect, alias, guards. You use it in phase 1 to name files and in the verification step to test each route.

Example:

| Path               | Name        | Component            | Notes                      |
| ------------------ | ----------- | -------------------- | -------------------------- |
| `/`                | `home`      | `views/Home.vue`     |                            |
| `/users`           | `users`     | `views/Users.vue`    | layout, has `<RouterView>` |
| `/users/:id(\\d+)` | `user`      | `views/User.vue`     | `props: true`              |
| `/admin`           |             | `layouts/Admin.vue`  | `meta.requiresAuth`        |
| `/:pathMatch(.*)*` | `not-found` | `views/NotFound.vue` |                            |

## 5. Decide the scope with the user

Ask the user which phases to do. Typical answers:

- "File-based routing only": do phase 1, keep the stable router.
- "Typed params": phases 1 to 3.
- "Only fix scroll": phase 4 alone, with the stable router.
- "No file-based routing, but the new matcher": phase 2 with a hand-written resolver ([fixed-resolver.md](fixed-resolver.md)).
