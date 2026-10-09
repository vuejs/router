---
name: migrate-v5-experimental-router
description: Migrate a Vue Router 4/5 app to the Vue Router 5 experimental stack, step by step. Covers file-based routing (vue-router/vite, vue-router/auto-routes), the experimental router with the fixed resolver (experimental_createRouter, vue-router/auto-resolver, createFixedResolver), custom param parsers (defineParamParser, [id=int], definePage params), and scroll restoration (ScrollRestoration, useScrollRestoration instead of scrollBehavior). Use when the user wants to adopt file-based routing, typed or parsed params, the new matcher, or replace scrollBehavior, or imports from vue-router/experimental. Also lists what the experimental router does not support yet (addRoute/removeRoute, beforeEnter, props, path overrides).
---

# Migrate to the Vue Router 5 experimental router

The experimental router replaces the `routes` array and the path-ranking matcher with a **resolver**: a fixed, ordered list of route records. Each record has matcher objects for its path, query, and hash. File-based routing generates this resolver at build time. Param parsers convert URL strings to typed values (and back) inside the matchers.

> [!WARNING]
> The experimental router is **not production-ready**. APIs can change in a minor release. Tell the user this before you start. Do not migrate a production app without their explicit approval.

## Migration phases

Do the phases in this order. Each phase gives a working app. Stop after each phase, run the checks, and commit only when the user asks.

| Phase | What changes                                                    | Router                 | Reference                                                              |
| ----- | --------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| 0     | Audit the app. Find blockers.                                   | any                    | [references/audit.md](references/audit.md)                             |
| 1     | `routes` array to `src/pages/` files                            | stable                 | [references/file-based-routing.md](references/file-based-routing.md)   |
| 2     | `createRouter` to `experimental_createRouter` + `auto-resolver` | experimental           | [references/experimental-router.md](references/experimental-router.md) |
| 3     | Manual coercion and `:id(\\d+)` to param parsers                | experimental           | [references/param-parsers.md](references/param-parsers.md)             |
| 4     | `scrollBehavior` to `ScrollRestoration`                         | stable or experimental | [references/scroll-restoration.md](references/scroll-restoration.md)   |

Phase 4 does not depend on phases 1 to 3. `ScrollRestoration` and `onRouteRendered()` also work with the stable `createRouter()`. You can do it first or alone.

If the app cannot use file-based routing, skip phase 1 and write the resolver by hand. See [references/fixed-resolver.md](references/fixed-resolver.md).

## Before you start: check the blockers

Read [references/limitations.md](references/limitations.md) first. These features block phase 2 or need a rewrite:

- **Dynamic routing.** The experimental router has no `addRoute()`, `removeRoute()`, or `clearRoutes()`. Routes added at runtime (plugins, `setupLayouts()`, permission-based routes, `routes.push(redirect)`) must move to build time.
- **`beforeEnter`** is deprecated (diagnostic `D0001`). Move the logic to `meta` + `router.beforeEach()`.
- **`props`** on route records is not supported. Read params with `useRoute()`.
- **`path` override in `definePage()` / `<route>`** does not change the generated matcher. Rename the file instead.
- **`parseQuery`** is ignored. `route.query` values are always arrays.

If the audit finds a blocker that has no workaround, stop and report it to the user. Do not invent an API.

## Rules

1. **Check the public contract.** Before you say a feature works, check the docs (`packages/docs/experimental/`, `packages/docs/file-based-routing/`), the types (`vue-router/experimental` exports), and the tests. Runtime behavior that has no docs or tests can change.
2. **Import from the correct entry.** Router factory, matchers, parsers, scroll restoration, data loaders: `vue-router/experimental`. Generated resolver: `vue-router/auto-resolver`. Generated routes (stable router only): `vue-router/auto-routes`. `RouterLink`, `RouterView`, `useRoute`, `useRouter`, history factories: `vue-router`.
3. **Install plugins before the router.** `app.use(DataLoaderPlugin, { router })` and `app.use(ScrollRestoration, { router, ... })` come before `app.use(router)`.
4. **Register `RouterLink` and `RouterView` yourself.** The experimental router `install()` does not register them.
5. **Use array query values.** `router.push({ query: { q: ['vue'] } })`. Non-array values warn (`D0002`).
6. **Use `null` to remove an optional param.** `undefined` or `''` warns (`R0122`).
7. **Do not put variables in `definePage()`.** It is extracted at build time (`B0002`). Imports are allowed.
8. **Verify with the app.** Run the type check, the unit tests, and the dev server after each phase. See [Verification](#verification).

## Quick reference: final setup

```ts
// vite.config.ts
import VueRouter from 'vue-router/vite'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    VueRouter({
      dts: 'src/route-map.d.ts',
      experimental: { paramParsers: true }, // scans src/params
    }),
    Vue(), // must come after VueRouter()
  ],
})
```

```ts
// src/router.ts
import { createWebHistory } from 'vue-router'
import { experimental_createRouter } from 'vue-router/experimental'
import { resolver, handleHotUpdate } from 'vue-router/auto-resolver'

export const router = experimental_createRouter({
  history: createWebHistory(),
  resolver,
})

if (import.meta.hot) handleHotUpdate(router)
```

```ts
// src/main.ts
import { createApp } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import {
  ScrollRestoration,
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
} from 'vue-router/experimental'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)
app.component('RouterLink', RouterLink)
app.component('RouterView', RouterView)
app.use(ScrollRestoration, {
  router,
  capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
})
app.use(router)
app.mount('#app')

declare module 'vue-router' {
  interface TypesConfig {
    Router: typeof router
  }
}
```

## Verification

After each phase:

1. Start the dev server once so the plugin writes the route map `.d.ts`.
2. Run the type check (`vue-tsc --noEmit` or the project script).
3. Run the unit and e2e tests.
4. Open each top-level route, one dynamic route, the 404 route, and one redirect. Use back/forward.
5. Read the browser console. Fix every Vue Router diagnostic. Codes are in [references/diagnostics.md](references/diagnostics.md).

## Reference index

- [audit.md](references/audit.md): find what the app uses, with search commands.
- [file-based-routing.md](references/file-based-routing.md): phase 1, file names, `definePage()`, HMR.
- [experimental-router.md](references/experimental-router.md): phase 2, behavior changes.
- [param-parsers.md](references/param-parsers.md): phase 3, path, query, hash params.
- [fixed-resolver.md](references/fixed-resolver.md): hand-written resolver without file-based routing.
- [scroll-restoration.md](references/scroll-restoration.md): phase 4, `scrollBehavior` patterns.
- [limitations.md](references/limitations.md): not implemented features and workarounds.
- [diagnostics.md](references/diagnostics.md): diagnostic codes you can see during the migration.
- [exports.md](references/exports.md): every `vue-router/experimental` export and where this skill covers it.
