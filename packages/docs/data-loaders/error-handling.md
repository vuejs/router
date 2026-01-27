# Error handling

By default, all errors thrown in a loader are considered _unexpected errors_: they will abort the navigation, just like in a navigation guard. Because they abort the navigation, they will not appear in the `error` property of the loader. Instead, they will be intercepted by Vue Router's error handling with `router.onError()`.

However, if the loader is **not navigation-aware**, the error cannot be intercepted by Vue Router and will be kept in the `error` property of the loader. This is the case for _lazy loaders_ and [_reloading data_](./reloading-data.md).

## Defining expected Errors

To be able to intercept errors in non-lazy loaders, we can specify a list of error classes that are considered _expected errors_. This allows blocking loader to **not abort the navigation** and instead keep the error in the `error` property of the loader and let the page locally display the error state.

```ts{3-10,14,18} twoslash
import { defineBasicLoader } from 'vue-router/experimental'
// custom error class
class MyError extends Error {
  // override is only needed in TS
  override name = 'MyError' // Displays in logs instead of 'Error'
  // defining a constructor is optional
  constructor(message: string) {
    super(message)
  }
}

export const useUserData = defineBasicLoader(
  async (to) => {
    throw new MyError('Something went wrong')
    // ...
    // ---cut-start---
    return { name: 'John' }
    // ---cut-end---
  },
  {
    errors: [MyError],
  }
)
```

You can also specify _expected errors_ globally for all loaders by providing the `errors` option to the `DataLoaderPlugin`.

```ts{4} twoslash
import { createApp } from 'vue'
import type { Router } from 'vue-router'
import { DataLoaderPlugin } from 'vue-router/experimental'
const app = createApp({})
const router = {} as Router
class MyError extends Error {
  name = 'MyError'
  constructor(message: string) {
    super(message)
  }
}
// @errors: 2769
// ---cut---
app.use(DataLoaderPlugin, {
  router,
  // checks with `instanceof MyError`
  errors: [MyError],
})
```

Then you need to opt-in in the loader by setting the `errors` option to `true` to keep the error in the `error` property of the loader.

```ts{7} twoslash
import { defineBasicLoader } from 'vue-router/experimental'
// ---cut---
export const useUserData = defineBasicLoader(
  async (to) => {
    throw new Error('Something went wrong')
    // ...
    // ---cut-start---
    return { name: 'John' }
    // ---cut-end---
  },
  {
    errors: true,
  }
)
```

::: details Why is `errors: true` needed?

One of the benefits of Data Loaders is that they ensure the `data` to be ready before the component is rendered. With expected errors, this is no longer true and `data` can be `undefined`:

```ts{11} twoslash
import { defineBasicLoader } from 'vue-router/experimental'
// ---cut---
export const useDataWithErrors = defineBasicLoader(
  async (to) => {
    // ...
    // ---cut-start---
    return { name: 'John' }
    // ---cut-end---
  },
  {
    errors: true,
  }
)

const { data } = useDataWithErrors()
data.value // `data` can be `undefined`
```

:::

## Custom Error handling

If you need more control over the error handling, you can provide a function to the `errors` option. This option is available in both the `DataLoaderPlugin` and when defining a loader.

```ts{3-9} twoslash
// @errors: 2769
import { createApp } from 'vue'
import { DataLoaderPlugin } from 'vue-router/experimental'
const app = createApp({})
const router = {} as any
// ---cut---
app.use(DataLoaderPlugin, {
  router,
  errors: (error) => {
    // Convention for custom errors
    if (error instanceof Error && error.name?.startsWith('My')) {
      return true
    }
    return false // unexpected error
  },
})
```

## Handling both, local and global errors

TODO: this hasn't been implemented yet

## Error handling priority

When you use both, global and local error handling, the local error handling has a higher priority and will override the global error handling. This is how the local and global errors are checked:

- if local `errors` is `false`: abort the navigation -> `data` is not `undefined`
- if local `errors` is `true`: rely on the globally defined `errors` option -> `data` is possibly `undefined`
- else: rely on the local `errors` option -> `data` is possibly `undefined`

## TypeScript

You will notice that the type of `error` is `Error | null` even when you specify the `errors` option. This is because if we call the `reload()` method (meaning we are outside of a navigation), the error isn't discarded, it appears in the `error` property **without being filtered** by the `errors` option.

In practice, depending on how you handle the error, you will add a [type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards) inside the component responsible for displaying an error or directly in a `v-if` in the template.

```vue-html
<template>
  <!-- ... -->
  <p v-if="isMyError(error)">{{ error.message }}</p>
</template>
```

If you want to be even stricter, you can override the default `Error` type with `unknown` (or anything else) by augmenting the `TypesConfig` interface.

```ts
// types-extension.d.ts
import 'vue-router'
export {}

declare module 'vue-router' {
  interface TypesConfig {
    Error: unknown
  }
}
```
