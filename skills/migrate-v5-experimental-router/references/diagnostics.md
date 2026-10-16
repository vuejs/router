# Diagnostics during the migration

Vue Router reports problems with stable codes. Runtime codes appear in the browser console (dev only). Build codes (`B`) appear in the dev server or build output. Source: `packages/router/src/diagnostics.ts` and `packages/router/src/unplugin/diagnostics.ts`. Read the `why` and `fix` text in those files for the current wording.

## Runtime

| Code    | Cause                                                                          | Fix                                                          |
| ------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `D0001` | A record uses `beforeEnter` (experimental router)                              | Move the check to `meta` + `router.beforeEach()`             |
| `D0002` | A query value is not an array (experimental router)                            | `{ key: [value] }`. Use `undefined` to remove the key.       |
| `R0008` | Invalid redirect. In the experimental router: a relative record redirect       | Return a name or an absolute path                            |
| `R0122` | An optional path param is removed with `undefined` or `''`                     | Use `null`                                                   |
| `R0040` | `el: '#x'` has no element with id `x`, but `querySelector` matches             | Use an id, or a selector without `#`                         |
| `R0041` | Invalid selector in `el`                                                       | `` `#${CSS.escape(id)}` ``                                   |
| `R0042` | No element for the `el` selector                                               | Check the selector, or guard against missing elements        |
| `R0043` | Two active `useScrollRestoration()` calls share a key with different functions | Give each call its own `key`                                 |
| `R0044` | `useScrollRestoration()` without the plugin                                    | `app.use(ScrollRestoration, {...})` before `app.use(router)` |
| `R1007` | `DataLoaderPlugin` installed twice                                             | Install it once                                              |
| `R1008` | Data loaders are experimental                                                  | Information only                                             |
| `R1009` | A loader returns `new NavigationResult()`                                      | Call `reroute(to)`                                           |

Plain warnings (no code) from the experimental router:

- `Cannot resolve relative location "..." without a "name" or a current location. This will crash in production.`: pass `router.currentRoute.value` to `router.resolve()`.
- `No match found for location with path "..."`: add a catch-all page or fix the link.
- `Record "x" not found` (thrown): the route name does not exist. Use the generated name.
- `A "hash" should always start with the character "#"`: add `#`.
- `Query param "x" ... uses raw param parser ... format: 'value'`: set `format: 'array'`.
- A console error for a missing custom parser: create `src/params/<name>.ts`.

## Build (file-based routing)

| Code               | Cause                                                 |
| ------------------ | ----------------------------------------------------- |
| `B0001` / `B0003`  | Syntax error in `definePage()`                        |
| `B0002`            | `definePage()` uses a `<script setup>` binding        |
| `B0004`            | `name` is not a string literal or `false`             |
| `B0005`            | `path` is not a string literal                        |
| `B0006`            | Unsupported `default` value for a query param         |
| `B0007` / `B0008`  | `alias` is not a string literal or an array of them   |
| `B0012` to `B0015` | Invalid `<route>` block content or language           |
| `B0017`            | A param without a name in a file name (`[]`)          |
| `B0018`            | A parser is re-exported, raw detection fails          |
| `B0019`            | Unknown parser name in a route                        |
| `B0020`            | Duplicate `definePage()` calls                        |
| `B0021`            | A parser is set in the file name and in `params.path` |
| `B0022`            | More than one hash param in a route                   |
| `B0023`            | Invalid custom `re` for a path param                  |
| `B0024`            | A custom `re` for a repeatable param can match `/`    |
