# Custom Param Parsers

::: warning Experimental
This feature is part of the [Experimental Router](./router-resolver.md). API and ergonomics may change. Make sure you've set it up first.
:::

Param parsers transform raw URL strings into rich JS values (and back) for **path**, **query**, and **hash** params, with end-to-end TypeScript types.

[[toc]]

## The problem (current way)

In the stable router, params and query come in as `string | string[] | null`. You either:

- pin a regex inline: `path: '/users/:id(\\d+)'`. Still typed as `string`, no parsing.
- coerce by hand inside the component: `const id = Number(route.params.id)`.
- write a `beforeEach` guard to validate or redirect: cannot let other routes match.

This works but the type system can't help you, every consumer has to know the convention, and query params are even worse.

## Setup

Enable `experimental.paramParsers` in the Vue Router Vite plugin. This tells the plugin where to scan for custom parsers and registers them both at runtime and in the generated `typed-router.d.ts`.

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'

export default defineConfig({
  plugins: [
    VueRouter({
      experimental: {
        paramParsers: {
          dir: 'src/params',
        },
      },
    }),
    vue(),
  ],
})
```

`src/params` is the default directory when setting `paramParsers` to `true`, but you can point `dir` to any project-relative folder, or to an array of folders.

## Built-in parsers

| Name     | Path | Query | Type      |
| -------- | :--: | :---: | --------- |
| `int`    |  ✅  |  ✅   | `number`  |
| `bool`   |  ✅  |  ✅   | `boolean` |
| `string` |  ✅  |  ✅   | `string`  |

`string` is the default param parser and does nothing. It's equivalent to not setting the parser.

```vue
<!-- src/pages/users/[id=int].vue -->
<script setup lang="ts">
const route = useRoute('/users/[id=int]')
route.params.id // number
</script>
```

## Defining custom parsers

You define param parsers as modules exporting a `parser` in the configured param parser directory. The file name is the parser name you use in routes. For example, `src/params/uuid.ts` exports a `parser` that validates UUIDs and can be used as `[id=uuid]` in route files.

A parser is just an object with a _getter_ and a _setter_. Vue Router provides three helpers: [`defineParamParser()`](#defineParamParser), [`defineParamParserRaw()`](#defineParamParserRaw), and [`defineHashParamParser()`](#defineHashParamParser).

Reach for `defineParamParser` first, it's the most common use case for simple one-to-one transforms. Use `defineParamParserRaw` when you need to collapse multiple input shapes into one output type or you want to reject _nullish_ or array values outright.

### `defineParamParser`

`defineParamParser` defines a single-value transform. The router wraps it for optional/repeatable usage and handles `null`/arrays for you.

```ts
// src/params/number.ts
import { defineParamParser, miss } from 'vue-router/experimental'

// pass the final type as a generic to enforce the return type of `get`
// and the input type of `set`
export const parser = defineParamParser<number>({
  get: value => {
    const n = Number(value)
    if (Number.isNaN(n)) miss(`"${value}" is not a number`)
    return n
  },
  set: value => String(value),
})
```

::: tip
Only write validation logic in `get`. The router runs it after `set` to normalize params and the throw will make the `push()`/`resolve()` call fail.
:::

This gives us the possibility to transform a param to a number (including floats), while preserving the _shape_ of the original params:

- `/products/[productId=number].vue` one single param:
  - `/products/42` → `route.params.productId`: `42`
- `/products/[productIds=number]+.vue` repeatable parameter:
  - `/products/42` → `route.params.productIds`: `[42]`
  - `/products/42/24` → `route.params.productIds`: `[42, 24]`
- `/products/[[productId=number]].vue` one single optional param:
  - `/products/42` → `route.params.productId`: `42`
  - `/products` → `route.params.productId`: `null`

The logic of the param parser is simple because `defineParamParser()` handles the underlying transformation between single/array/nullish values. You just define how to get from a single string to your desired type and back.

### `defineParamParserRaw`

`defineParamParserRaw` gives full control over the transformation. You must handle every shape (`null`, `undefined`, single, array) yourself, but in exchange you can collapse them all into one output type (e.g. always return a `Set<string>`, whether the input was missing, a single value, or an array).
Below, the result is always a `Set<string>`, regardless of whether the URL provided nothing, one value, or many.

```ts
// src/params/test-set.ts
import { defineParamParserRaw } from 'vue-router/experimental'

// pass the final type as a generic so `route.params.<name>` is typed
export const parser = defineParamParserRaw<Set<string>>({
  get: value => {
    if (value == null) return new Set()
    return new Set(
      Array.isArray(value) ? value.filter(v => v != null) : [value]
    )
  },
  set: value => [...value],
})
```

::: tip
While you can also return `null`, `undefined`, or a simple _string_ from `set`, returning an **array** is usually the best choice: an empty array `[]` is treated the same as `null` (the param is omitted), so a single `[...value]` covers every case without branching. After navigation, `get` runs again to validate the value, so any invalid combination still goes through your own check.

```ts
export const parser = defineParamParserRaw<Set<string>>({
  get: value => {
    if (value == null) return new Set()
    return new Set(
      Array.isArray(value) ? value.filter(v => v != null) : [value]
    )
  },
  // empty Set → [] → param omitted, single → ['one'], many → ['a', 'b']
  set: value => [...value],
})
```

Here is a table of the different meaningful combinations of return values from `set` and how the router treats them for path and query params:

| `set` returns        | Path param                | Query param                                                      |
| -------------------- | ------------------------- | ---------------------------------------------------------------- |
| `null` / `undefined` | param is omitted          | param is omitted (`undefined`) or rendered empty (`null`, `?k=`) |
| `string`             | single segment (`/value`) | single entry (`?k=value`)                                        |
| `string[]`           | repeatable (`/a/b/c`)     | repeated entries (`?k=a&k=b`)                                    |

:::

### `defineHashParamParser`

`defineHashParamParser` defines a transform for the hash. Both `get` and `set` are required: `get` receives a `string`, and `set` returns a `string`. The helper returns your parser unchanged, without array or nullish wrapping. You can specify the parsed type with `defineHashParamParser<TParam>` and a wider setter input with `defineHashParamParser<TParam, TParamRaw>`.

The getter receives the hash contents without the leading `#`: `#setup` calls `get('setup')`, and a bare `#` calls `get('')`. An absent hash (`''`) skips the getter and produces `undefined`, or the configured default.

For example, use the hash contents as a heading name:

```ts
// src/params/heading.ts
import { defineHashParamParser } from 'vue-router/experimental'

export const parser = defineHashParamParser<string>({
  get: hash => hash,
  set: heading => heading,
})
```

Use `params: { hash: { heading: 'heading' } }` in `definePage()`. A hash of `#setup` gives `route.params.heading === 'setup'`. The setter returns contents without `#`. The matcher adds `#` to a present result, including `''`, which produces a bare `#`. Pass `undefined` to clear an optional hash param. You can also pass `null` when the parser or default type includes it.

## Errors

Throw any error from `get` to mark the value as not matching. The router skips the route (treat it like a 404 candidate). `miss(reason?)` is just sugar for throwing a typed error.

## Standard Schema (Zod / Valibot)

Any [Standard Schema](https://standardschema.dev) compatible schema can be used directly as a parser:

```ts
// src/params/month-zod.ts
import { z } from 'zod'
export const parser = z.coerce.number().int().min(1).max(12)
```

::: warning
Standard Schema is one-way: it parses input but cannot serialize back. The router stringifies the value with `String(value)` when navigating, so this only works when `String(parsed) === original`. See [standard-schema#14](https://github.com/standard-schema/standard-schema/issues/14). For anything more complex, use `defineParamParser` with an explicit `set`.
:::

## Using parsers in routes

### Path params

You can either _rename your file_ to include `=parser` within a _param segment_: `[productId]` -> `[productId=uuid]`, or you can declare the parser through `definePage` without renaming the file:

```vue
<!-- src/pages/users/[id].vue -->
<script setup lang="ts">
definePage({
  params: {
    path: {
      id: 'number',
    },
  },
})
</script>
```

### Query params

Declared inside `definePage()`:

```vue
<script setup lang="ts">
definePage({
  params: {
    query: {
      // single value (first one wins if multiple are provided)
      page: { parser: 'int', format: 'value', default: 1 },
      // array form: ?tag=a&tag=b → ['a','b']
      tag: { parser: 'string', format: 'array' },
    },
  },
})
</script>
```

Options per query field:

- `parser`: parser name (from `src/params/*`). Omit for raw string.
- `format`: `'value'` (single, takes the **first** value if the URL has several) or `'array'`.
- `default`: value or `() => value` used when the param is missing or parsing fails and it's not required.
- `required`: navigation fails if absent (instead of using `default`).

### Hash params

Declare one named hash param in `definePage()`:

```vue
<script setup lang="ts">
definePage({
  params: {
    hash: { section: 'section' },
  },
})
</script>
```

Hash params are optional by default. An absent hash skips the getter and produces `undefined`. Parsed values such as `null`, `false`, `0`, and `''` are preserved. For optional hash params, parser errors produce `undefined` or the configured default. Set `required: true` to reject missing hashes, parser errors, or `undefined` results. A default replaces only `undefined` results and parser errors:

```vue
<script setup lang="ts">
definePage({
  params: {
    hash: {
      section: {
        parser: 'section',
        default: () => ({ heading: 'overview', tab: 'vue' }),
      },
    },
  },
})
</script>
```

- `parser`: parser name. Omit to use `string`, which returns the hash contents without `#`. An absent hash produces `undefined` unless you provide a default.
- `required`: reject the match when the hash is absent, parsing fails, or the parsed value is `undefined`. Defaults to `false`.
- `default`: a parsed value or factory used when the hash is absent, parsing fails, or the parsed value is `undefined`. An absent hash skips the getter.

`required: true` and `default` cannot be used together.

Without a parser, a default must be a `string`, `null`, or a factory that returns `string | null`. Other default types require an explicit parser: `{ default: 0 }` is invalid; `{ parser: 'int', default: 0 }` is valid.

With `hash: { section: {} }`, an absent hash becomes `undefined`, `#` becomes `''`, and `#setup` becomes `'setup'`. The parsed type is `string | undefined`.

A default can itself be `null`, including when the parser is omitted. For example, `{ default: null }` and `{ parser: 'heading', default: null }` have the parsed type `string | null`, using the `heading` parser above. An absent hash uses the `null` default, while a bare `#` preserves `''`. The parsed type includes the default type, including `null` for `default: null`. Without a default, an optional hash param also includes `undefined` for an absent hash.

The API limits defaults without an explicit parser to `string | null`. However, code generation currently uses `unknown` if it cannot infer the type of such a default expression. Use an explicit parser to keep the generated type bounded by the parser's declared type.

The parser receives the hash contents without `#`. An absent hash skips the getter. To extract several values, return an object from this one parser. Only the deepest matched route's hash parser runs.

```ts
// src/params/section.ts
import { defineHashParamParser } from 'vue-router/experimental'

export const parser = defineHashParamParser<{ heading: string; tab: string }>({
  get: hash => {
    if (!hash) throw new Error('Missing section')
    const [heading = '', tab = ''] = hash.split('/')
    return { heading, tab }
  },
  set: ({ heading, tab }) => `${heading}/${tab}`,
})
```

`route.params.section` contains `{ heading, tab }`. Navigate with the parsed value:

```ts
router.push({
  name: '/guide',
  params: { section: { heading: 'setup', tab: 'vue' } },
})
```

You can omit an optional hash param or one with a default during navigation. Pass `undefined` to clear an optional hash param. You can also pass `null` when the parser or default type includes it. Required params without a default must be provided. Nullish values produce an empty hash without calling the setter. The setter returns contents without `#`. The matcher adds `#` to each present result, including `''`, which produces a bare `#`. The router then runs the getter on these contents to validate and normalize the result. Clearing the URL hash skips the getter and produces `undefined` or the configured default in `route.params`.
