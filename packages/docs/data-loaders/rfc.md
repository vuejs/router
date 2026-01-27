---
outline: 'deep'
---

# Data Loaders

- Start Date: 2022-07-14
- Target Major Version: Vue 3, Vue Router 4
- Reference Issues: -
- [Discussion](https://github.com/vuejs/rfcs/discussions/460)
- [Implementation PR](https://github.com/posva/unplugin-vue-router/tree/main/src/data-loaders)

## Todo List

List of things that haven't been added to the document yet:

- [ ] Extendable API for data fetching libraries like vue-apollo, vuefire, vue-query, etc
- [ ] Warn if a non lazy loader is used without data: meaning it was used in a component without it being exported by a page component. Either make it lazy or export it

## Summary

There is no silver bullet to data fetching because of the different data fetching strategies and how they can define the architecture of the application and its UX. However, I think it's possible to find a solution that is flexible enough to **promote good practices** and **reduce the complexity** of data fetching in applications.
That is the goal of this RFC, to standardize and improve data fetching with vue-router:

- Integrate data fetching to the navigation cycle
  - Blocks navigation while fetching or _defer_ less important data (known as _lazy_ in Nuxt)
- Deduplicate requests
- Delay data updates until all data loaders are resolved
  - Avoids displaying partially up-to-date data and inconsistent state
  - Configurable through a `commit` option
- Optimal data fetching
  - Defaults to parallel fetching
  - Semantic sequential fetching if needed
- Avoid `<Suspense>`
  - No cascading loading states
  - No double mounting
  - [more...](#suspense)
- Provide atomic and global access to loading/error states
- Allow 3rd party libraries to extend the loaders functionality by establish a set of Interfaces that can be implemented. This targets libraries like [VueFire](https://vuefire.vuejs.org), [@pinia/colada][pinia-colada], [vue-apollo](https://apollo.vuejs.org/), [@tanstack/vue-query][vue-query], etc to provide features like caching, pagination, etc. specific to their use cases.

<!-- Extra Goals:

- Automatically rerun when used params/query params/hash changes (avoid unnecessary fetches)
- -->

This proposal concerns Vue Router 4 and is implemented under [unplugin-vue-router][uvr]. This enables types in data loaders but **is not necessary**. This feature is independent of the rest of the plugin and can be used without it, namely **without file-based routing**.

::: tip
In this RFC, data loaders are often referred as _loaders_ for short. API names also use the word _loader_ instead of _data loader_ for brevity.

💡 Some of the examples are interactive: hover or tap on the code to see the types and other information.
:::

## Basic example

We create data loaders with a `defineLoader()` function that returns a **composable that can be used in any component** (not only pages component).

The loader is then picked up by a Navigation Guard. It can be attached to a page component in two ways:

- Export the loader from the page component it is attached to. It must be lazy loaded (`() => import('~/pages/users-details.vue')`)
- Manually add the loader to the route definition's `meta.loaders[]`

Exported from a non-setup `<script>` in a page component:

```vue twoslash
<script lang="ts">
// ---cut-start---
import { defineComponent } from 'vue'
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
// ---cut-end---
// @moduleResolution: bundler
import { getUserById } from '../api'

// name the loader however you want **and export it**
export const useUserData = defineLoader(async route => {
  const user = await getUserById(route.params.id as string)
  // ...
  // return anything you want to expose
  return user
})

// Optional: define other component options
export default defineComponent({
  name: 'custom-name',
  inheritAttrs: false,
})
</script>

<script lang="ts" setup>
// find the user as `data` and some other properties
const { data: user, isLoading, error, reload } = useUserData()
// data is always present, isLoading changes when going from '/users/2' to '/users/3'
</script>
```

When a loader is exported by the page component, it is **automatically** picked up as long as the route is **lazy loaded** (which is a best practice). If the route isn't lazy loaded, the loader can be directly defined in an array of data loaders on `meta.loaders`:

```ts twoslash
import './shims-vue.d'
// ---cut---
// @moduleResolution: bundler
import { createRouter, createWebHistory } from 'vue-router'
import UserList from './pages/UserList.vue'
// could be anywhere
import { useUserList, useUserData, type User } from './loaders/users'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/users',
      component: UserList,
      meta: {
        // Required when the component is not lazy loaded
        loaders: [useUserList],
      },
    },
    {
      path: '/users/:id',
      // automatically picks up all exported loaders
      component: () => import('./pages/UserDetails.vue'),
    },
  ],
})
```

Regarding the returned values from `useUserData()`:

- `data` (aliased to `user`), `isLoading`, and `error` are shallow ref and therefore reactive.
- `reload` is a function that can be called to force a reload of the data without a new navigation.

Note `useUserData()` can be used in **any component**, not only in the page component: just import the function and call it within `<script setup>` like other composables

<!-- Advanced use case (cached):

- Loaders smartly know which params/query params/hash they depend on to force a reload when navigating:
  - Going from `/users/2` to `/users/3` will reload the data no matter how recent the other fetch was because `useUserData` depends on `route.params.id`
  - Going from `/users/2?name=fab` to `/users/2?name=fab#filters` will try to avoid fetching again as the `route.params.id` didn't change: it will check if the current client side cache expired and if it did, it will fetch again

 -->

By default, **data loaders block the navigation**, meaning they _just work_ with SSR and errors are propagated to the router level (`router.onError()`). On top of that, data loads are deduplicated, which means that no mather how many page components use the same loader (e.g. nested pages), **it will still load the data just once per navigation**.

The simplest of data loaders can be defined in just one line and types will be automatically inferred:

```ts twoslash
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
interface Book {
  title: string
  isbn: string
  description: string
}
function fetchBookCollection(): Promise<Book[]> {
  return {} as any
}
// ---cut---
export const useBookCollection = defineLoader(fetchBookCollection)
const { data } = useBookCollection()
```

Note that this syntax will intentionally be avoided in the RFC. Instead, we will often use slightly longer examples to make things easier to follow.

## Motivation

There are currently too many ways of handling data fetching with vue-router and all of them have problems:

- With navigation guards:
  - using `onBeforeRouteUpdate()`: only works on subsequent navigations. Cannot be properly combined with `beforeRouteEnter()`.
  - using `beforeRouteEnter()`: non typed and non-ergonomic API with `next()`, requires a data store (pinia, vuex, apollo, etc), does not exist in script setup
  - using `meta`: complex to setup even for simple cases, too low level for such a common case
- using a watcher on `route.params...`: component renders without the data (doesn't work with SSR)
- Using Suspense and _awaiting_ data within page components
  - Cascading (slow) async states
  - Only loads once (on mounting)
  - Does not wait for navigation (or requires double mounting: pending + current view)
  - Requires handling UI loading state
  - [And more](#suspense)

People are left with a low level API (navigation guards) to handle data fetching themselves. This is often a difficult problem to solve because it requires an extensive knowledge of the Router concepts and in reality, very few people know them. This leads to incomplete implementations that don't handle all the edge cases and don't provide a good user experience.

Thus, the goal of this proposal is to provide a simple yet extendable way of defining data loading in your application that is easy to understand and use. It should also be compatible with SSR and not limited to simple _fetch calls_, but rather any async state. It should be adoptable by frameworks like Nuxt.js to provide an augmented data fetching layer that integrates well with Vue.js concepts and the future of Web APIs like the [Navigation API](https://github.com/WICG/navigation-api/).

## Detailed design

The design of Data Loaders is split into two parts

- [Implementations](#implementations)
  - A bare-bone data loader
  - A more advanced data loader with client side caching using [@pinia/colada][pinia-colada]
- The set of [Interfaces (types)](#interfaces) that define a Data Loader (WIP)

::: tip
You might only be interested in trying out Data Loaders. In that case, check out the [implementations](#implementations) section for instructions on how to use this. It's still recommended to read the rest of the RFC to understand what to expect from Data Loaders.
:::

### Data Loader Setup

`DataLoaderPlugin` adds the [navigation guard](#the-navigation-guard) that handles the data loaders. It requires access to the router instance to attach the navigation guard as well as some other options:

- `router`: The Vue Router instance.
- `selectNavigationResult` (optional): Called wih an array of `NavigationResult` returned by loaders. It allows to decide the _fate_ of the navigation that was modified by loaders. See [NavigationResult](#handling-multiple-navigation-results)

```ts{2,9}
import { createApp } from 'vue'
import { createRouter } from 'vue-router'
import { DataLoaderPlugin } from 'vue-router/experimental'

const router = createRouter({
  // ...
})

const app = createApp(App)
app.use(DataLoaderPlugin, { router })
// add the router after the DataLoaderPlugin
app.use(router)
```

It's important to add the `DataLoaderPlugin` before the router to ensure the navigation guards are attached before the router initiates the first navigation.

### Core Data Loader features

These are the core features of the Data Loader API that every data loader should implement. Throughout the RFC, we will use a **non-existent**, **generic** `defineLoader()`. This is a placeholder for the actual name of the function, e.g. [`defineBasicLoader()`](./basic/), [`defineColadaLoader()`](./colada/), etc. In practice, one can globally alias the function to `defineLoader` with [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import).

Data Loaders should be able to load data based **solely on the URL**. This ensures that the page can be shared and that the rendering is consistent between the server and the client.

#### `defineLoader()` signature

Data Loaders must accept an optional first parameter to type the route:

```ts twoslash
import 'vue-router/auto-routes'
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
// ---cut---
import { getUserById } from '../api'

export const useUserData = defineLoader('/users/[id]', async route => {
  return getUserById(route.params.id)
})
```

The rest of the parameters are up to the implementation of the loader but they should accept [extra options](#defineloader-options).

Within loaders there is no access to the current component or page instance, but it's possible to access global injections created with `app.provide()`. This includes stores created with [Pinia](https://pinia.vuejs.org).

#### Returned Composables

Data Loaders are composables that return a set of properties:

```ts twoslash
import 'vue-router/auto-routes'
import { useUserData } from './loaders/users'
// ---cut---
const {
  // hover over each property to see the type
  data,
  isLoading,
  error,
  reload,
} = useUserData()
```

- `data` contains the resolved value returned by the loader. It's a shallow ref to be more performant, especially with large data-sets
- `isLoading` is `true` while a request is isLoading and becomes `false` once the request is settled
- `error` contains any error thrown by the loader. It's also a shallow ref
- `reload()` reruns the loader outside of a navigation

In practice, rename `data` (or others) to something more meaningful:

```ts twoslash
import 'vue-router/auto-routes'
import { useUserData } from './loaders/users'
// ---cut---
const { data: user } = useUserData()
```

#### `defineLoader()` options

- `lazy`: By default, loaders block the navigation. This means that the navigation is only allowed to continue once all loaders are resolved. Lazy loaders **do not block the navigation**. `data`, `error` and other properties might be updated after the navigation finishes. Setting this to `true` is useful for non-critical data fetching and will change the type of the returned `data` to `ShallowRef<T | undefined>`:

  ```ts twoslash
  import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
  interface Book {
    title: string
    isbn: string
    description: string
  }
  function fetchBookCollection(): Promise<Book[]> {
    return {} as any
  }
  // ---cut---
  export const useBookCollection = defineLoader(fetchBookCollection, {
    lazy: true,
  })
  const { data: bookCollection } = useBookCollection()
  //            ^ can be undefined
  ```

- `commit`: Controls when the async state is reflected in `data` and `error`. You can choose to immediately reflect the state of the loader or
  delay the update of the data until all loaders are resolved (default). The latter is useful to avoid displaying partially up-to-date data and inconsistent state.

  ```ts twoslash
  import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
  interface Book {
    title: string
    isbn: string
    description: string
  }
  function fetchBookCollection(): Promise<Book[]> {
    return {} as any
  }
  // ---cut---
  export const useBookCollection = defineLoader(fetchBookCollection, {
    commit: 'immediate',
  })
  ```

  A lazy loader can use `commit: 'after-load'` but since it's not awaited during the navigation, it might be reflected **after the navigation**.

- `server`: By default, loaders are executed on both, client, and server. Setting this to false will skip its execution on the server. Like `lazy: true`, this also changes the type of the returned `data` to `ShallowRef<T | undefined>`:

  ```ts twoslash
  import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
  interface Book {
    title: string
    isbn: string
    description: string
  }
  function fetchBookCollection(): Promise<Book[]> {
    return {} as any
  }
  // ---cut---
  export const useBookCollection = defineLoader(fetchBookCollection, {
    server: false,
  })
  ```

Each custom implementation can augment the returned properties with more information. For example, [Pinia Colada](./colada/) adds `refresh()`, `status` and other properties specific to its features.

#### Parallel Fetching

By default, loaders are executed as soon as possible, in parallel. This scenario works well for most use cases where data fetching only requires route params/query params or nothing at all.

#### Sequential fetching

Sometimes, requests depend on other fetched data (e.g. fetching additional user information). For these scenarios, we can simply import the other loaders and use them **within a different loader**:

Call **and `await`** the loader inside the one that needs it, it will only be fetched once no matter how many times it is called during a navigation:

```ts twoslash
import 'vue-router/auto-routes'
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
// ---cut---
// import the loader for user information
import { useUserData } from './loaders/users'
import { getCommonFriends, getCurrentUser } from './api'

export const useUserCommonFriends = defineLoader(async route => {
  // loaders must be awaited inside other loaders
  // .        ⤵
  const user = await useUserData() // magically works
  const me = await getCurrentUser()

  // fetch other data
  const commonFriends = await getCommonFriends(me.id, user.id)
  return { ...user, commonFriends }
})
```

You will notice here that we have two different usages for `useUserData()`:

- One that returns all the necessary information we need _synchronously_ (not used here). This is the composable that we use in components
- A second version that **only returns a promise of the data**. This is the version used within data loaders that enables sequential fetching.

::: danger
`useUserData()` expects the route to have an `id` param to fetch the current user. We could maybe allow passing the route as a parameter to ensure the type safety as well to further differentiate the two usages (and their type).
:::

##### Nested invalidation

Since `useUserCommonFriends()` loader calls `useUserData()`, if `useUserData()` is somehow _invalidated_, it will also automatically invalidate `useUserCommonFriends()`. This depends on the implementation of the loader and is not a requirement of the API.

::: warning
Two loaders cannot use each other as that would create a _dead lock_.
:::

This can get complex with multiple pages exposing the same loader and other pages using some of their _already exported_ loaders within other loaders. But it's not an issue, **the user shouldn't need to handle anything differently**, loaders are still only called once:

```ts twoslash
import 'vue-router/auto-routes'
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
// ---cut---
import {
  getFriends,
  getCommonFriends,
  getUserById,
  getCurrentUser,
} from './api'

export const useUserData = defineLoader('/users/[id]', async route => {
  return getUserById(route.params.id)
})

export const useCurrentUserData = defineLoader('/users/[id]', async route => {
  const me = await getCurrentUser()
  // imagine legacy APIs that cannot be grouped into one single fetch
  const friends = await getFriends(me.id)

  return { ...me, friends }
})

export const useUserCommonFriends = defineLoader('/users/[id]', async route => {
  const user = await useUserData()
  const me = await useCurrentUserData()

  const friends = await getCommonFriends(user.id, me.id)
  return { ...me, commonFriends: { with: user, friends } }
})
```

In the example above we are exporting multiple loaders but we don't need to care about the order in which they are called nor try optimizing them because **they are only called once and share the data**.

::: danger
**Caveat**: must call **and await** all nested loaders at the top of the parent loader (see `useUserData()` and `useCurrentUserData()`). You cannot put a different regular `await` in between. If you really need to await **anything that isn't a loader** in between, wrap the promise with `withDataContext()` to ensure the loader context is properly restored:

```ts{3}
export const useUserCommonFriends = defineLoader(async (route) => {
  const user = await useUserData()
  await withContext(functionThatReturnsAPromise())
  const me = await useCurrentUserData()

  // ...
})
```

This allows nested loaders to be aware of their _parent loader_. This could probably be linted with an eslint plugin. It is similar to the problem `<script setup>` had before introducing the automatic `withAsyncContext()`. The same feature could be introduced (via a vite plugin) but will also have a performance cost. In the future, this _should_ be solved with the [async-context](https://github.com/tc39/proposal-async-context) proposal (stage 2).
:::

#### Cache <Badge type="warning" text=">=0.8.0" />

::: warning
This part has been removed from the core features of the API. It's now part of custom implementations like [Pinia Colada](./colada/).
:::

#### Smart Refreshing

This is not a requirement of the API.

When navigating, depending on the loader, the data is refreshed **automatically based on what params, query params, and hash** are used within the loader.

e.g. using [Pinia Colada](./colada/), given this loader in page `/users/:id`:

```ts
export const useUserData = defineColadaLoader(async route => {
  const user = await getUserById(route.params.id)
  return user
})
```

Going from `/users/1` to `/users/2` will reload the data but going from `/users/2` to `/users/2#projects` will not unless the cache expires or is manually invalidated (known as _refresh_).

#### Deduplication

Loaders also have the advantage of behaving as singleton requests. This means that they are only fetched once per navigation no matter how many times the loader is attached or how many regular components use it. It also means that all the refs (`data`, `isLoading`, etc) are created only once and shared by all components, reducing memory usage.

#### SSR

Each Data Loader implementation is responsible for providing a way to serialize the data loaded on the server and pass it to the client. This is a requirement for SSR to work properly.

Different implementations could have different kind of keys. The simplest form is a string:

```ts
export const useBookCollection = defineLoader(
  async () => {
    const books = await fetchBookCollection()
    return books
  },
  { key: 'bookCollection' }
)
```

##### Avoiding double fetch on the client

One of the advantages of having an initial state is that we can avoid fetching on the client. Data Loaders can implement a mechanism to skip fetching on the client if the initial state is provided ([Pinia Colada](./colada/) implements this). This means nested loaders **aren't executed either**. Since data loaders shouldn't contain side effects besides data fetching, this shouldn't be a problem.

### The Navigation Guard

The bulk of the logic of data loaders is handled with navigation guards:

- one `router.beforeEach()` to collect loaders from lazy loaded components
- one `router.beforeResolve()` (triggers after other guards) to execute the loaders

`router.afterEach()` and `router.onError()` are also used to handle errors and cleanup.

Handling the data loading in a navigation guards has the following advantages:

- Ensure data is present before mounting the component
- Flexibility to not wait for non critical data with lazy data loaders
- Enables the UX pattern of letting the browser handle loading state (aligns with [future Navigation API](https://github.com/WICG/navigation-api))
- Makes scrolling work out of the box when navigating between pages (when data loaders are blocking)
- Ensure one single request per loader and navigation
- Allows controlling the navigation (aborting, redirecting, etc)

#### Controlling the navigation

Since the data fetching happens within a navigation guard, it's possible to control the navigation like in regular navigation guards:

- Thrown errors (or rejected Promises) cancel the navigation (same behavior as in a regular navigation guard) and are intercepted by [Vue Router's error handling](https://router.vuejs.org/api/interfaces/router.html#onerror)
- Redirection: `return new NavigationResult(targetLocation)` -> like `return targetLocation` in a regular navigation guard
- Cancelling the navigation: `return new NavigationResult(false)` like `return false` in a regular navigation guard
- Any other returned value is considered as the _resolved data_

```ts{1,11,14}
import { NavigationResult } from 'vue-router'

export const useUserData = defineLoader(
  async (to) => {
    try {
      const user = await getUserById(to.params.id)

      return user
    } catch (error) {
      if (error.status === 404) {
        return new NavigationResult({ name: 'not-found', params: { pathMatch: '' } }
        )
      } else {
        throw error // aborts the vue router navigation
      }
    }
  }
)
```

`new NavigationResult()` accepts as its only argument anything that [can be returned in a navigation guard](https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards) to alter the navigation. e.g. it doesn't accept `true` or `undefined` as these do not modify the navigation.

Some alternatives:

::: details

- `createNavigationResult()`: too verbose
- `NavigationResult()` (no `new`): `NavigationResult` is not a primitive so it should use `new`
- Accept a second argument for extra custom context that can be retrieved in `selectNavigationResult()`

:::

::: tip

Throwing an error does not trigger the `selectNavigationResult()` method. Instead, it immediately cancels the navigation and triggers the `router.onError()` method, just like in a regular navigation guard.

:::

#### Handling multiple navigation results

Since navigation loaders can run in parallel, they can return different navigation results as well. In this case, you can decide which result should be used by providing a `selectNavigationResult()` method to [`DataLoaderPlugin`](#data-loader-setup):

```ts{3-6} twoslash
import 'vue-router/auto-routes'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { DataLoaderPlugin } from 'vue-router/experimental'
const app = createApp({})
const router = createRouter({
  history: createWebHistory(),
  routes: [],
})
// ---cut---
// @moduleResolution: bundler
// @noErrors
app.use(DataLoaderPlugin, {
  router,
  selectNavigationResult(results) {
    for (const { value } of results) {
      if (
        typeof value === 'object' &&
        'name' in value &&
        value.name === 'not-found'
      ) {
        return value
      }
    }
  },
})
```

`selectNavigationResult()` is called with an array of all the returned `new NavigationResult(value)` **after all data loaders** have been resolved. **If any of them throws an error** or if none of them return a `NavigationResult`, `selectNavigationResult()` isn't called.

By default, `selectNavigation` returns the first value of the array.

#### Eagerly changing the navigation

If a loader wants to eagerly alter the navigation, it can `throw` the `NavigationResult` instead of returning it. This skips the `selectNavigationResult()` and take precedence without triggering `router.onError()`.

```ts{10-15}
import { NavigationResult } from 'vue-router/experimental'

export const useUserData = defineLoader(
  async (to) => {
    try {
      const user = await getUserById(to.params.id)

      return user
    } catch (error) {
      throw new NavigationResult({
        name: 'not-found',
        params: { pathMatch: to.path.split('/') },
        query: to.query,
        hash: to.hash,
      })
    }
  }
)
```

::: info

When using vue router named views, each named view can have their own loaders but note any navigation to the route will trigger **all loaders from all page components**. This is because the router doesn't know which named views will be used.

:::

### Advanced Error handling

Since throwing an error in a loader cancels the navigation, this doesn't allow to have an error property in _non lazy loaders_ to display the error in the UI. To solve this, we can specify expected errors when defining the loader:

```ts{2-9,16}
// custom error class
class MyError extends Error {
  // override is only needed in TS
  override name = 'MyError' // Displays in logs instead of 'Error'
  // defining a constructor is optional
  constructor(message: string) {
    super(message)
  }
}

export const useUserData = defineLoader(
  async (to) => {
    // ...
  },
  {
    errors: [MyError],
  }
)
```

These can also be specified globally:

```ts{11-13}
class MyError extends Error {
  name = 'MyError'
  constructor(message: string) {
    super(message)
  }
}

app.use(DataLoaderPlugin, {
  router,
// checks with `instanceof MyError`
  errors: [MyError],
})
```

::: tip

In a lazy loader, you can throw an error and since it doesn't block the navigation it will **always** appear in the `error` property. Defining an `errors` property won't change anything.

:::

### Usage outside of page components

Loaders can be attached to a page even if the page component doesn't use it (invoke the composable returned by `defineLoader()`). This is possible if a nested component uses the data. It can be used in any component by importing the _returned composable_, even outside of the scope of the page components, even by a parent.

On top of that, loaders can be **defined anywhere** and imported where using the data makes sense. This allows to define loaders in a separate `src/loaders` folder and reuse them across pages:

```ts
// src/loaders/user.ts
export const useUserData = defineLoader(...)
// ...
```

Then, in a page component, export it:

```vue
<!-- src/pages/users/[id].vue -->
<script>
export { useUserData } from '~/loaders/user.ts'
</script>
<script setup>
// ...
</script>
```

The page component might not even use `useUserData()` but we can still use it anywhere else:

```vue
<!-- src/components/NavBar.vue -->
<script setup>
import { useUserData } from '~/loaders/user.ts'

const { data: user } = useUserData()
</script>
```

::: warning
If you use a loader in a component while it wasn't exported by a page, it won't be awaited during navigation. This can lead to unexpected behavior but it can be caught during development with a warning.
:::

### TypeScript

Types are automatically generated for the routes by [unplugin-vue-router][uvr] and can be referenced with the name of each route to hint `defineLoader()` the possible values of the current types. On top of that, `defineLoader()` infers the returned types:

```vue twoslash
<script lang="ts">
// ---cut-start---
import 'vue-router/auto-routes'
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
// ---cut-end---
import { getUserById } from '../api'

export const useUserData = defineLoader('/users/[id]', async route => {
  //                                                ^|

  //
  const user = await getUserById(route.params.id)
  //                                          ^|
  // ...
  return user
})
</script>

<script lang="ts" setup>
const { data: user, isLoading, error } = useUserData()
//            ^?
//            👆 hover or tap
</script>
```

The arguments can be removed during the compilation step in production mode since they are only used for types and are ignored at runtime.

### Non blocking data fetching (Lazy Loaders)

Also known as [lazy async data in Nuxt](https://v3.nuxtjs.org/api/composables/use-async-data), loaders can be marked as lazy to **not block the navigation**.

```vue{10,16-17} twoslash
<script lang="ts">
// ---cut-start---
import 'vue-router/auto-routes'
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
// ---cut-end---
import { getUserById } from '../api'

export const useUserData = defineLoader(
  '/users/[id]',
  async (route) => {
    const user = await getUserById(route.params.id)
    return user
  },
  { lazy: true } // 👈  marked as lazy
)
</script>

<script setup>
// Differently from the example above, `user.value` can and will be initially `undefined`
const { data: user, isLoading, error } = useUserData()
//            ^?
//            👆 hover or tap
</script>
```

This patterns is useful to avoid blocking the navigation while _non critical data_ is being fetched. It will display the page earlier while some of the parts of it are still loading and you are able to display loader indicators thanks to the `isLoading` property.

Note this still allows for having different behavior during SSR and client side navigation, e.g.: if we want to wait for the loader during SSR but not during client side navigation:

```ts{6-7}
export const useUserData = defineLoader(
  async (route) => {
    // ...
  },
  {
    lazy: !import.env.SSR, // Vite
    lazy: process.client, // NuxtJS
  }
)
```

Existing questions:

- [~~Should it be possible to await all pending loaders with `await allPendingLoaders()`? Is it useful for SSR? Otherwise we could always ignore lazy loaders in SSR. Do we need both? Do we need to selectively await some of them?~~](https://github.com/vuejs/rfcs/discussions/460#discussioncomment-3532011)
- Should we be able to transform a loader into a lazy version of it: `const useUserDataLazy = asLazyLoader(useUserData)`

### AbortSignal

The loader receives in a second argument access to an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that can be passed on to `fetch` and other Web APIs. If the navigation is cancelled because of errors or a new navigation, the signal aborts, causing any request using it to abort as well.

```ts twoslash
import { defineBasicLoader as defineLoader } from 'vue-router/experimental'
interface Book {
  title: string
  isbn: string
  description: string
}
function fetchBookCollection(options: {
  signal?: AbortSignal
}): Promise<Book[]> {
  return {} as any
}
// ---cut---
export const useBookCollection = defineLoader(async (_route, { signal }) => {
  return fetchBookCollection({ signal })
})
```

This aligns with the future [Navigation API](https://github.com/WICG/navigation-api#navigation-monitoring-and-interception) and other web APIs that use the `AbortSignal` to cancel an ongoing invocation.

### Implementations

### Interfaces

Defining a minimal set of information and options for Data Loaders is what enables external libraries to implement their own data loaders. They are meant to extend these interfaces to add more features that are specific to them. You can see a practical example with the [Pinia Colada](./colada/) implementation.

::: danger
This section is still a work in progress, see the [implementations](#implementations) instead.
:::

### Global API

It's possible to access a global state of when data loaders are fetching (during navigation or when `reload()` is called) as well as when the data fetching navigation guard is running (only when navigating).

- `isFetchingData: Ref<boolean>`: is any loader currently fetching data? e.g. calling the `reload()` method of a loader
- `isNavigationFetching: Ref<boolean>`: is navigation being hold by a loader? (implies `isFetchingData.value === true`). Calling the `reload()` method of a loader doesn't change this.

TBD: is this worth it? Are any other functions needed?

### Limitations

- ~~Injections (`inject`/`provide`) cannot be used within a loader~~ They can now
- Watchers and other composables shouldn't be used within data loaders:
  - if `await` is used before calling a composable e.g. `watch()`, the scope **is not guaranteed**
  - In practice, **this shouldn't be a problem** because there is **no need** to create composables within a loader

## Drawbacks

- At first, it looks less intuitive than just awaiting something inside `setup()` with `<Suspense>` [but it doesn't have its limitations](#suspense) and have many more features
- Requires an extra `<script>` tag but only for page components. A macro `definePageLoader()`/`defineLoader()` could be error-prone as it's very tempting to use reactive state declared within the component's `<script setup>` but that's not possible as the loader must be created outside of its `setup()` function

## Alternatives

### Suspense

Using Suspense is probably the first alternative that comes to mind and it has been considered as a solution for data fetching by implementing proofs of concepts. It however suffers from major drawbacks that are tied to its current design and is not a viable solution for data fetching.

One could imagine being able to write something like:

```vue
<!-- src/pages/users.vue = /users -->
<!-- Displays a list of all users -->
<script setup>
const userList = shallowRef(await fetchUserList())

// manually expose a reload function to be called whenever needed
function reload() {
  userList.value = await fetchUserList()
}
</script>
```

Or when params are involved in the data fetching:

```vue
<!-- src/pages/users.[id].vue = /users/:id -->
<!-- Displays a list of all users -->
<script setup>
const route = useRoute()
const user = shallowRef(await fetchUserData(route.params.id))

// manually expose a reload function to be called whenever needed
function reload() {
  user.value = await fetchUserData(route.params.id)
}

// hook into navigation instead of a watcher because we want to block the navigation
onBeforeRouteUpdate(async (to) => {
  // note how we need to use `to` and not `route` here
  user.value = await fetchUserData(to.params.id)
})
</script>
```

This setup has many limitations:

- Nested routes will force **sequential data fetching**: it's not possible to ensure an **optimal parallel fetching**
- Manual data refreshing is necessary **unless you add a `key` attribute** to the `<RouterView>` which will force a remount of the component on navigation. This is not ideal because it will remount the component on every navigation, even when the data is the same. It's necessary if you want to do a `<transition>` but less flexible than the proposed solution which also works with a `key` if needed.
- By putting the fetching logic within the `setup()` of the component we face other issues:
  - No abstraction of the fetching logic => **code duplication** when fetching the same data in multiple components
  - No native way to deduplicate requests among multiple components using them: it requires using a store and extra logic to skip redundant fetches when multiple components are using the same data
  - Does not block the navigation
    - We can block it by mounting the upcoming page component (while the navigation is still blocked by the data loader navigation guard) which can be **expensive in terms of rendering and memory** as we still need to render the old page while we _**try** to mount the new page_.
  - Cannot modify the output of the navigation (e.g. redirecting, cancelling, etc), if the fetching fails, we end up in an error state

- No native way of caching data, even for very simple cases (e.g. no refetching when fast traveling back and forward through browser UI)
- Not possible to precisely read (or write) the loading state (see [vuejs/core#1347](https://github.com/vuejs/core/issues/1347)])

On top of this it's important to note that this RFC doesn't limit you: you can still use Suspense for data fetching or other async state or even use both, **this API is completely tree shakable** and doesn't add any runtime overhead if you don't use it. Aligning with the progressive enhancement nature of Vue.js.

### Other alternatives

- Allowing blocking data loaders to return objects of properties:

  ::: details

  ```ts
  export const useUserData = defineLoader(async route => {
    const user = await getUserById(route.params.id)
    // instead of return user
    return { user }
  })
  // instead of const { data: user } = useUserData()
  const { user } = useUserData()
  ```

  This was the initial proposal but since this is not possible with lazy loaders it was more complex and less intuitive. Having one single version is overall easier to handle. It does allow to return pending promises in the object that aren't awaited:

  ```ts
    export const useUserData = defineLoader(async (route) => {
    return {
      // awaited
      user: await getUserById(route.params.id)
      // not awaited, like lazy
      nonCriticalData: getNonCriticalData() // Promise<...>
    }
  })
  ```

  But this version overlaps with `lazy: true`. While semantically it would be more natural if it was defined with **one** loader, it limits the API to one loader per page and not being able to reuse the data, loading state, error, etc across pages and components, which also limits the extensibility.

  :::

- Adding a new `<script loader>` similar to `<script setup>`:

  ::: details

  ```vue
  <script lang="ts" loader="useUserData">
  import { getUserById } from '~/api/users'
  import { useRoute } from 'vue-router' // could be automatically imported

  const route = useRoute()
  // any variable created here is available in useLoader()
  const user = await getUserById(route.params.id)
  </script>

  <script lang="ts" setup>
  const { user, isLoading, error } = useUserData()
  </script>
  ```

  Too magical without clear benefit.

  :::

- Pass route properties instead of the whole `route` object:

  ::: details

  ```ts
  import { getUserById } from '../api'

  export const useUserData = defineLoader(async ({ params }) => {
    const user = await getUserById(params.id)
    return { user }
  })
  ```

  This has the problem of not being able to use the `route.name` to determine the correct typed params (with [unplugin-vue-router][uvr]):

  ```ts
  import { getUserById } from '../api'

  export const useUserData = defineLoader(async route => {
    if (route.name === 'user-details') {
      const user = await getUserById(route.params.id)
      //                                    ^ typed!
      return { user }
    }
  })
  ```

  :::

- Naming

  ::: details

  Variables could be named differently and proposals are welcome:
  - `isLoading` -> `isPending`, `pending` (same as Nuxt)
  - Rename `defineLoader()` to `defineDataFetching()` (or others)

  :::

- Nested/Sequential Loaders drawbacks

  ::: details
  - Allowing `await getUserById()` could make people think they should also await inside `<script setup>` and that would be a problem because it would force them to use `<Suspense>` when they don't need to. I think this is solved by changing the return type of the loader to a promise of just data, making it easy to spot the mistake. It could also be solved by forcing the need of a parameter `to` to ensure the type safety as explained [above](#sequential-fetching).

  - Another alternative is to pass an array of loaders to the loader that needs them and let it retrieve them through an argument, but it feels _considerably_ less ergonomic:

    ```ts
    import { useUserData } from '~/pages/users/[id].vue'

    export const useUserFriends = defineLoader(
      async (route, { loaders: [userData] }) => {
        const friends = await getFriends(user.value.id)
        return { ...userData.value, friends }
      },
      {
        // explicit dependencies
        waitFor: [useUserData],
      }
    )
    ```

  :::

- Advanced `lazy`

  ::: details

  The `lazy` flag could be extended to also accept a number (timeout) or a function (dynamic value). I think this is too much and should therefore not be included. It can always be implemented by custom data loaders but I don't think it should be a requirement for the basic API.

  Passing a _number_ to `lazy` could block the navigation for that number of milliseconds, then let it be:

  ```vue
  <script lang="ts">
  import { getUserById } from '../api'

  export const useUserData = defineLoader(
    async route => {
      const user = await getUserById(route.params.id)
      return user
    },
    // block the navigation for 1 second and then let the navigation go through
    { lazy: 1000 }
  )
  </script>

  <script setup>
  const { data, isLoading, error } = useUserData()
  //      ^ Ref<User | undefined>
  </script>
  ```

  Note that lazy loaders can only control their own blocking mechanism. They can't control the blocking of other loaders. If multiple loaders are being used and one of them is blocking, the navigation will be blocked until all of the blocking loaders are resolved.

  A function could allow to conditionally block upon navigation:

  ```ts
  export const useUserData = defineLoader(
    loader,
    // ...
    {
      lazy: route => {
        // ...
        return true // or a number
      },
    }
  )
  ```

  :::

- One could argue being able to reuse the result of loaders across any component other than page makes this more complex. Other frameworks expose a single _load_ function from page components (SvelteKit, Remix)

## Adoption strategy

Introduce this as part of [unplugin-vue-router][uvr] to test it first and make it part of the router later on.

## Unresolved questions

- Integration with Server specifics in Frameworks like Nuxt: cookies, headers, server only loaders (can create redirect codes)
- Should there by a `beforeLoad()` hook that is called and awaited before all data loaders
- Same for `afterLoad()` that is always called after all data loaders
- What else is needed besides the `route` inside loaders?
- ~~Add option for placeholder data?~~ Data Loaders should implement this themselves
- What other operations might be necessary for users?

<!--

TODO: we could attach an effect scope it each loader, allowing creating reactive variables that are automatically cleaned up when the loader is no longer used by collecting whenever the `useLoader()` fn is called and removing them when the component is unmounted, if the loader is not used anymore, remove the effect scope as well. This requires a way to create the variables so the user can pass a custom composable.

 -->

[uvr]: https://github.com/posva/unplugin-vue-router 'unplugin-vue-router'
[pinia-colada]: https://github.com/posva/pinia-colada '@pinia/colada'
[vue-query]: https://tanstack.com/query/latest/docs/framework/vue/overview '@tanstack/vue-query'
