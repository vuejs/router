---
name: migrate-v5-experimental-router
disable-model-invocation: true
description: Step-by-step help to migrate your Vue Router app to file-based routing, the Vue Router 5 experimental router, param parsers, or scroll restoration.
---

# Migrate to the Vue Router 5 experimental router

The experimental router replaces the `routes` array and the path-ranking matcher with a **resolver**: a fixed, ordered list of route records. Each record has matcher objects for its path, query, and hash. File-based routing generates this resolver at build time. Param parsers convert URL strings to typed values (and back) inside the matchers.

> [!WARNING]
> The experimental router is **not production-ready**. APIs can change in a minor release. Tell the user this before changing the app. For a production app, confirm that the user has authorized experimental APIs; ask only if their request leaves this unclear.

## Migration phases

Select the phases needed for the user’s request. For a full migration, use the order below. Verify each phase before you continue. Commit only when the user asks.

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

Before phase 2, read [references/limitations.md](references/limitations.md). Check dynamic routing, `beforeEnter`, route-record `props`, path overrides, and custom query parsing. The reference gives the current status and workarounds.

If the audit finds a blocker that has no workaround, stop and report it to the user. Do not invent an API.

## Rules

1. **Check the public contract.** Before you say a feature works, check the docs (`packages/docs/experimental/`, `packages/docs/file-based-routing/`), the types (`vue-router/experimental` exports), and the tests. Runtime behavior that has no docs or tests can change.
2. **Import from the correct entry.** Router factory, matchers, parsers, scroll restoration, data loaders: `vue-router/experimental`. Generated resolver: `vue-router/auto-resolver`. Generated routes (stable router only): `vue-router/auto-routes`. `RouterLink`, `RouterView`, `useRoute`, `useRouter`, history factories: `vue-router`.
3. **Install plugins before the router.** `app.use(DataLoaderPlugin, { router })` and `app.use(ScrollRestoration, { router, ... })` come before `app.use(router)`.
4. **Register `RouterLink` and `RouterView` yourself.** The experimental router `install()` does not register them.
5. **Use array query values.** `router.push({ query: { q: ['vue'] } })`. Non-array values warn (`D0002`).
6. **Use `null` to remove an optional param.** `undefined` or `''` warns (`R0122`).
7. **Do not put variables in `definePage()`.** It is extracted at build time (`B0002`). Imports are allowed.

## Verification

After each selected phase, use the project’s existing scripts and test tools:

1. Start the dev server. For file-based routing, check that the plugin writes the route map `.d.ts`.
2. Run the type check (`vue-tsc --noEmit` or the project script).
3. Run the relevant unit and e2e tests, if available.
4. Test affected routes and representative dynamic, 404, and redirect cases. Use back/forward. For scroll changes, check capture and restoration.
5. Read the browser console and build output. Resolve migration-related warnings and errors; explain informational diagnostics. Codes are in [references/diagnostics.md](references/diagnostics.md).

## Reference index

- [audit.md](references/audit.md): find what the app uses, with search commands.
- [file-based-routing.md](references/file-based-routing.md): phase 1, file names, `definePage()`, HMR.
- [experimental-router.md](references/experimental-router.md): phase 2, behavior changes.
- [param-parsers.md](references/param-parsers.md): phase 3, path, query, hash params.
- [fixed-resolver.md](references/fixed-resolver.md): hand-written resolver without file-based routing.
- [scroll-restoration.md](references/scroll-restoration.md): phase 4, `scrollBehavior` patterns.
- [limitations.md](references/limitations.md): not implemented features and workarounds.
- [diagnostics.md](references/diagnostics.md): diagnostic codes you can see during the migration.
