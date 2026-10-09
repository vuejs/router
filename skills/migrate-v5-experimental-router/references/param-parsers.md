# Phase 3: Custom param parsers

Goal: parse params in the matcher, not in components or guards. A parser converts a URL string to a typed value (`get`) and back (`set`). If `get` throws, the route does not match, and the next route (for example the 404) can match.

Requires the experimental router (phase 2). Docs: `packages/docs/experimental/param-parsers.md`.

## 1. Enable parsers

```ts
VueRouter({
  experimental: {
    paramParsers: true, // same as { dir: 'src/params' }
    // paramParsers: { dir: ['src/params', 'src/shared/params'] },
  },
})
```

Defaults: `dir: ['src/params']`, `include: ['*.ts']`, `exclude: ['*.test.{ts,js}', '*.spec.{ts,js}']`. Only flat files in `dir` are scanned.

Without this option, the generated types only contain path params, as strings. Query params, hash params, and parser types are missing from the route map. Always enable it in this phase.

## 2. Built-in parsers

| Name     | Type      | Accepts                                                                             |
| -------- | --------- | ----------------------------------------------------------------------------------- |
| `int`    | `number`  | safe integers: `'42'`, `'-1'`. Rejects `''`, `'1.5'`, `'abc'`.                      |
| `bool`   | `boolean` | only `'true'` and `'false'` (any case). A valueless query key (`?debug`) is `true`. |
| `string` | `string`  | anything. Same as no parser.                                                        |

Exported as `PARAM_PARSER_INT` and `PARAM_PARSER_BOOL` for hand-written resolvers.

A custom file with the same name (`src/params/int.ts`) overrides the built-in parser.

## 3. Path params

Two ways. Pick one per param. If you use both, `definePage()` wins and the build warns `B0021`.

```text
src/pages/users/[id=int].vue          → id: number
src/pages/users/[[id=int]].vue        → id: number | null
src/pages/products/[ids=int]+.vue     → ids: number[]
src/pages/events/[when=date].vue      → when: Date (custom parser)
```

```vue
<!-- src/pages/users/[id].vue: no rename -->
<script setup lang="ts">
definePage({
  params: {
    path: {
      id: 'int',
      // or with a regexp: id: { parser: 'int', re: /\d{1,6}/ },
    },
  },
})
</script>
```

The `re` option replaces old `:id(\\d+)` regexps:

- No capturing groups. Use `(?:...)`.
- Must not match an empty value.
- No `^` or `$`.
- Flags are ignored. Paths are always case-insensitive.
- For repeatable params, do not match `/` (`B0024`). Use `[^/]+`.
- `re: null` uses the default regexp. `parser: null` removes a parser set in the file name.

### Migrate manual coercion

| Before                                                 | After                                               |
| ------------------------------------------------------ | --------------------------------------------------- |
| `path: '/users/:id(\\d+)'` + `Number(route.params.id)` | `users/[id=int].vue`, `route.params.id` is a number |
| `beforeEach` guard that rejects bad ids                | parser `get` that calls `miss()`                    |
| `route.params.date` + `new Date(...)` in the component | `src/params/date.ts` + `[date=date].vue`            |

Navigation uses the typed value: `router.push({ name: '/users/[id=int]', params: { id: 42 } })`.

## 4. Query params

Declare them in `definePage()`. Their values go to **`route.params`**, not `route.query`. `route.query` still has the raw arrays.

```vue
<script setup lang="ts">
definePage({
  params: {
    query: {
      page: { parser: 'int', format: 'value', default: 1 },
      tag: { format: 'array' }, // ?tag=a&tag=b → ['a', 'b']
      sort: 'string', // short form: parser name only
      token: { required: true }, // no match without ?token=
    },
  },
})

const route = useRoute()
route.params.page // number
route.params.tag // string[]
</script>
```

| Option     | Meaning                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `parser`   | parser name. Omit for a raw string.                                                                |
| `format`   | `'value'` (default): one value, the **last** one wins. `'array'`: always an array.                 |
| `default`  | literal or `() => value`. Used when the key is missing, the parser throws, or returns `undefined`. |
| `required` | the route does not match when the value is missing or invalid. Cannot be combined with `default`.  |

Query params of parent records are merged with the child ones.

Navigate with params: `router.push({ name: route.name, params: { ...route.params, page: 2 } })`.

## 5. Hash param

One hash param per route (`B0022`). The value has no leading `#`.

```vue
<script setup lang="ts">
definePage({
  params: {
    hash: {
      page: { parser: 'int', default: 1 }, // #2 → 2, no hash or #abc → 1
    },
  },
})
</script>
```

- No parser: the value is a `string`. A default must be a `string` or `null`.
- Optional by default. The type includes `undefined` unless there is a `default`.
- Set it to `undefined` (or `null` if the type allows) to remove the hash.

## 6. Write a custom parser

Create `src/params/<name>.ts` with a named `parser` export. The file name is the parser name: `src/params/uuid.ts` gives `[id=uuid]` and `{ parser: 'uuid' }`. Define the parser inline in the file. A re-export prevents raw-parser detection (`B0018`).

### `defineParamParser`: one value in, one value out (use this first)

```ts
// src/params/date.ts
import { defineParamParser, miss } from 'vue-router/experimental'

export const parser = defineParamParser<Date>({
  get: value => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) miss(`Invalid date: "${value}"`)
    return date
  },
  set: date => date.toISOString().replace('T00:00:00.000Z', ''),
})
```

The router wraps it for optional (`null`), repeatable (arrays), and query params. Put validation in `get`. For named locations the router runs `set` then `get`, so invalid values fail there too.

### `defineParamParserRaw`: you handle `null`, `undefined`, and arrays

Use it to collapse all shapes to one type, or to reject nullish or array values.

```ts
// src/params/tags.ts
import { defineParamParserRaw } from 'vue-router/experimental'

export const parser = defineParamParserRaw<Set<string>>({
  get: value => {
    if (value == null) return new Set()
    return new Set(
      Array.isArray(value) ? value.filter(v => v != null) : [value]
    )
  },
  // [] means "omit the param"
  set: value => [...value],
})
```

A raw parser forces `format: 'array'` for query params.

| `set` returns        | Path param        | Query param                        |
| -------------------- | ----------------- | ---------------------------------- |
| `null` / `undefined` | omitted           | `undefined`: omitted. `null`: `?k` |
| `string`             | one segment       | `?k=value`                         |
| `string[]`           | repeated segments | `?k=a&k=b`                         |

### `defineHashParamParser`: the hash content

```ts
// src/params/section.ts
import { defineHashParamParser, miss } from 'vue-router/experimental'

export const parser = defineHashParamParser<{ heading: string; tab: string }>({
  get: hash => {
    const [heading, tab] = hash.split('/')
    if (!heading || !tab) miss()
    return { heading, tab }
  },
  set: ({ heading, tab }) => `${heading}/${tab}`,
})
```

### Standard Schema (Zod, Valibot)

```ts
// src/params/month.ts
import { z } from 'zod'
export const parser = z.coerce.number().int().min(1).max(12)
```

Limits:

- One-way only. The router uses `String(value)` to build the URL. Use this only when `String(parsed)` gives back the URL value. Otherwise use `defineParamParser` with `set`.
- Async validation is not supported. It throws in dev.
- In a hand-written resolver, a raw schema is not wrapped for you. Wrap it with `_normalizeParamParser()` (internal) or write a `defineParamParser`.

### Errors

Any error thrown in `get` makes the route not match. `miss(reason?)` throws a `MatchMiss` with a reason. During path matching the router tries the next record. During named resolution (`push({ name, params })`) the error is thrown to the caller.

## 7. Check phase 3

- The route map `.d.ts` has `_ParamParsers` entries and typed params.
- No `B0019` (unknown parser) build warning and no console error for missing parsers.
- An invalid value (`/users/abc` for `[id=int]`) shows the 404 page.
- Remove the old manual coercion and validation guards.
