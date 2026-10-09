# Hand-written resolver (no file-based routing)

Use this when the app keeps a manual route list but wants the experimental router and param parsers. File-based routing generates the same code, so the generated `vue-router/auto-resolver` module is also a good example. In this repo, `packages/experiments-playground/src/router/index.ts` is a complete hand-written resolver.

All imports come from `vue-router/experimental`.

## Concepts

- A **record** is `normalizeRouteRecord({...})`. Normalize each record **once** and reuse the same object as `parent`.
- A record has matchers: `path` (required for matchable records), `query` (array), `hash` (one).
- Nesting uses `parent`, not `children`. A child path is the **full** path, not relative to the parent.
- `components` is always an object of named views: `{ default: () => import(...) }`. There is no `component` field.
- `createFixedResolver(records)` takes **matchable** records only (with `name` and `path`).
- **Order matters. The first record that matches wins.** There is no ranking at runtime.

## Matchers

```ts
new MatcherPatternPathStatic('/about')
```

Exact, case-insensitive match. The path must be already percent-encoded (`'/caf%C3%A9'`). A trailing slash does not match.

```ts
new MatcherPatternPathDynamic(
  re, // RegExp, use the /i flag. One capturing group per param, in order.
  params, // { name: [parser?, repeatable?, optional?] } in the SAME order as the groups
  pathParts, // build template: 'segment' | 1 (param) | 0 (splat) | ['pre-', 1, '-post']
  trailingSlash // false (default): no trailing slash. true: required. null: both.
)
```

Regexp conventions used by the code generator:

| Param kind   | Group in `re`     | Options                                     |
| ------------ | ----------------- | ------------------------------------------- |
| `:id`        | `\/([^/]+?)`      | `[parser]`                                  |
| `:id?`       | `(?:\/([^/]+?))?` | `[parser, false, true]`                     |
| `:ids+`      | `\/(.+?)`         | `[parser, true]`                            |
| `:ids*`      | `(?:\/(.+?))?`    | `[parser, true, true]`                      |
| splat `(.*)` | `\/(.*)`          | `[]`, pathParts `[0]`, trailingSlash `null` |

```ts
new MatcherPatternQueryParam(paramName, queryKey, format, parser?, defaultValue?, required?)
// format: 'value' (last value wins) | 'array'

new MatcherPatternHashParam(paramName, parser?, defaultValue?, required?)
```

Use `{}` or `undefined` for "no parser". Use `PARAM_PARSER_INT`, `PARAM_PARSER_BOOL`, or a parser from `defineParamParser()`.

Custom matchers: any object `{ match(value), build(params) }` that satisfies `MatcherPatternPath`, `MatcherPatternQuery`, or `MatcherPatternHash`. `match` throws (or calls `miss()`) when it does not match. In a query matcher, each `query[key]` can be `string`, `null`, an array, or `undefined`.

## Complete example

```ts
// src/router.ts
import { createWebHistory } from 'vue-router'
import {
  experimental_createRouter,
  createFixedResolver,
  normalizeRouteRecord,
  MatcherPatternPathStatic,
  MatcherPatternPathDynamic,
  MatcherPatternQueryParam,
  MatcherPatternHashParam,
  PARAM_PARSER_INT,
} from 'vue-router/experimental'

const home = normalizeRouteRecord({
  name: 'home',
  path: new MatcherPatternPathStatic('/'),
  components: { default: () => import('./pages/Home.vue') },
})

// layout. Its query matchers apply to every child.
const users = normalizeRouteRecord({
  name: 'users',
  path: new MatcherPatternPathStatic('/users'),
  components: { default: () => import('./layouts/Users.vue') },
  meta: { requiresAuth: true },
  query: [
    new MatcherPatternQueryParam('page', 'page', 'value', PARAM_PARSER_INT, 1),
  ],
})

// index child: reuses the parent path matcher
const usersList = normalizeRouteRecord({
  name: 'users-list',
  path: users.path,
  components: { default: () => import('./pages/UsersList.vue') },
  parent: users,
})

// /users/:id(int), full path
const user = normalizeRouteRecord({
  name: 'user',
  path: new MatcherPatternPathDynamic(
    /^\/users\/([^/]+?)$/i,
    { id: [PARAM_PARSER_INT] },
    ['users', 1]
  ),
  hash: new MatcherPatternHashParam('tab', {}, 'profile'),
  components: { default: () => import('./pages/User.vue') },
  parent: users,
})

// /docs/:lang?
const docs = normalizeRouteRecord({
  name: 'docs',
  path: new MatcherPatternPathDynamic(
    /^\/docs(?:\/([^/]+?))?$/i,
    { lang: [undefined, false, true] },
    ['docs', 1]
  ),
  components: { default: () => import('./pages/Docs.vue') },
})

// alias: a separate record that points to the original
const people = normalizeRouteRecord({
  ...usersList,
  path: new MatcherPatternPathStatic('/people'),
  aliasOf: usersList,
})

// redirect record
const oldHome = normalizeRouteRecord({
  name: 'old-home',
  path: new MatcherPatternPathStatic('/home'),
  redirect: { name: 'home' },
})

// catch-all
const notFound = normalizeRouteRecord({
  name: 'not-found',
  path: new MatcherPatternPathDynamic(/^\/(.*)$/i, { path: [] }, [0], null),
  components: { default: () => import('./pages/NotFound.vue') },
})

export const router = experimental_createRouter({
  history: createWebHistory(),
  resolver: createFixedResolver([
    home,
    oldHome,
    usersList, // index child before its parent (same path)
    user,
    users,
    people,
    docs,
    notFound, // always last
  ]),
})
```

## Ordering rules

Sort the array like the code generator does:

1. Static paths before paths with params.
2. Segments with a param inside (`users_:id`) before full-segment params.
3. Required params, then optional, then repeatable, then optional repeatable.
4. An index child before its parent when they share a path.
5. The catch-all last.

A record that fails its query or hash matcher (for example a `required` query param) is skipped. The next record is tried.

If two records have the same name, the last one wins without a warning. Check names.

## Group records

A record with no `name` and no `path` is a **group**. It cannot be matched or named. It can have `components` (a layout), `meta`, and `query`. Use it as `parent` for records that share a layout but no URL segment. Do not pass it to `createFixedResolver()`.

```ts
const adminLayout = normalizeRouteRecord({
  components: { default: () => import('./layouts/Admin.vue') },
  meta: { requiresAuth: true },
})
const dashboard = normalizeRouteRecord({
  name: 'dashboard',
  path: new MatcherPatternPathStatic('/dashboard'),
  components: { default: () => import('./pages/Dashboard.vue') },
  parent: adminLayout,
})
```

## Translate a stable routes array

| Stable record                  | Experimental record                                             |
| ------------------------------ | --------------------------------------------------------------- |
| `component: X`                 | `components: { default: X }`                                    |
| `components: { default, aux }` | same                                                            |
| `children: [child]`            | `child.parent = parent`, child path is the full path            |
| `path: ''` child               | `path: parent.path`                                             |
| `alias: '/b'`                  | extra record `{ ...rec, path: matcherFor('/b'), aliasOf: rec }` |
| `redirect: '/x'` or `{ name }` | same, must be absolute or named                                 |
| `redirect: 'relative'`         | not allowed (`R0008`)                                           |
| `beforeEnter`                  | `meta` + `router.beforeEach()`                                  |
| `props: true`                  | not supported, read `useRoute().params`                         |
| record without `name`          | add a `name`. Records without a name cannot match.              |
| `:id(\\d+)`                    | `{ id: [PARAM_PARSER_INT] }` or a custom regexp in `re`         |

Write a unit test for the resolver: call `router.resolve('/users/42')` and assert `name` and `params`. Call `router.resolve({ name: 'user', params: { id: 42 } })` and assert `fullPath`.
