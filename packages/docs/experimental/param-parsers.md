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

| Name     | Path | Query | Hash | Type      |
| -------- | :--: | :---: | :--: | --------- |
| `int`    |  ✅  |  ✅   |  ✅  | `number`  |
| `bool`   |  ✅  |  ✅   |  ✅  | `boolean` |
| `string` |  ✅  |  ✅   |  ✅  | `string`  |

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

Reach for `defineParamParser` first, it's the most common use case for simple one-to-one transforms. Use `defineParamParserRaw` when you need to collapse multiple input shapes into one output type or you want to reject _nullish_ or array values outright. Use `defineHashParamParser` for hash params.

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

To remove an optional path param, pass `null` when navigating.

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

| `set` returns        | Path param                | Query param                                                               |
| -------------------- | ------------------------- | ------------------------------------------------------------------------- |
| `null` / `undefined` | param is omitted          | param is omitted (`undefined`) or rendered without a value (`null`, `?k`) |
| `string`             | single segment (`/value`) | single entry (`?k=value`)                                                 |
| `string[]`           | repeatable (`/a/b/c`)     | repeated entries (`?k=a&k=b`)                                             |

:::

### `defineHashParamParser`

`defineHashParamParser` defines a parser for the hash. `get` receives the hash contents without the leading `#` and `set` returns them. Unlike `defineParamParser`, it does not wrap arrays or nullish values.

A route has only one hash param. To read several values from the hash, return an object:

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

Use the object form to also restrict the values the param matches with a custom regexp:

```vue
<!-- src/pages/[org].vue -->
<script setup lang="ts">
definePage({
  params: {
    path: {
      // only matches `/@vuejs`, not `/vuejs`
      org: { re: /@\w+/ },
      // or combine it with a parser
      // org: { parser: 'org', re: /@\w+/ },
    },
  },
})
</script>
```

The regexp is inserted as a group inside the regexp of the whole path, so it must only describe the value of the param:

- It must not contain capturing groups, use `(?:...)` instead.
- It must not match an empty value (e.g. `/a*/`).
- Do not use anchors like `^` or `$`: they apply to the whole path, not to the param value.
- Its flags are ignored: paths are always matched case-insensitively.

For repeatable params, each value must match the regexp, so the regexp should not match `/` (e.g. use `[^/]+` instead of `.+`). Set `re` to `null` to use the default regexp.

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

Declare one named hash param in `definePage()`. Without a parser, the param is the hash contents without `#`:

```vue
<script setup lang="ts">
definePage({
  params: {
    hash: { heading: {} },
  },
})
// no hash → undefined, `#` → '', `#setup` → 'setup'
</script>
```

Use a native parser like `int`, or a custom one like the `section` parser above:

```vue
<script setup lang="ts">
definePage({
  params: {
    hash: {
      // `#2` → 2, no hash or `#abc` → 1
      page: { parser: 'int', default: 1 },
    },
  },
})
</script>
```

```ts
// in another page: hash: { section: 'section' }
router.push({
  name: '/guide',
  params: { section: { heading: 'setup', tab: 'vue' } },
})
// → /guide#setup/vue
```

Options:

- `parser`: parser name. Omit it to use `string`.
- `default`: value or `() => value` used when the hash is absent, the parser throws, or it returns `undefined`.
- `required`: reject the match in these same cases instead. You cannot use it with `default`.

Hash params are optional by default: their type includes `undefined` unless you set a `default`. An absent hash never calls the getter. Other parsed values, such as `null`, `0`, or `''`, are kept as they are.

Without a parser, the default must be a `string` or `null`. For other types, set a parser: `{ default: 0 }` is invalid, `{ parser: 'int', default: 0 }` is valid. If code generation cannot infer the type of a default without a parser, it uses `unknown`.

When you navigate, you can omit an optional hash param or one with a default. Set it to `undefined` (or `null` if its type allows it) to remove the hash. The router adds the `#` to the result of `set`, then runs `get` on it to validate and normalize the value.
