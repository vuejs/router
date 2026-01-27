# Nested loaders

Sometimes, requests depend on other fetched data (e.g. fetching additional user information). For these scenarios, we can simply import the other loaders and use them **within a different loader**:

Call **and `await`** the loader inside the one that needs it, it will only be fetched once no matter how many times it is called during a navigation:

```ts twoslash
import 'vue-router/auto-routes'
import { defineBasicLoader } from 'vue-router/experimental'
// ---cut---
// import the loader for user information
import { useUserData } from './loaders/users'
import { getCommonFriends, getCurrentUser } from './api'

export const useUserCommonFriends = defineBasicLoader(async route => {
  // loaders must be awaited inside other loaders
  // .        ⤵
  const user = await useUserData()

  // fetch other data
  const me = await getCurrentUser()
  const commonFriends = await getCommonFriends(me.id, user.id)
  return { ...user, commonFriends }
})
```

You will notice here that we have two different usages for `useUserData()`:

- One that returns all the necessary information we need _synchronously_ (not used here). This is the composable that we use in components
- A second version that **only returns a promise of the data**. This is the version used within data loaders that enables sequential fetching.

## Nested invalidation

Since `useUserCommonFriends()` loader calls `useUserData()`, if `useUserData()` is somehow _invalidated_, it will also automatically invalidate `useUserCommonFriends()`. This depends on the implementation of the loader and is not a requirement of the API.

::: warning
Two loaders cannot use each other as that would create a _dead lock_.
:::

This can get complex with multiple pages exposing the same loader and other pages using some of their _already exported_ loaders within other loaders. But it's not an issue, **the user shouldn't need to handle anything differently**, loaders are still only called once:

```ts twoslash
import 'vue-router/auto-routes'
import { defineBasicLoader } from 'vue-router/experimental'
// ---cut---
import {
  getFriends,
  getCommonFriends,
  getUserById,
  getCurrentUser,
} from './api'

export const useUserData = defineBasicLoader('/users/[id]', async route => {
  return getUserById(route.params.id)
})

export const useCurrentUserData = defineBasicLoader(
  '/users/[id]',
  async route => {
    const me = await getCurrentUser()
    // imagine legacy APIs that cannot be grouped into one single fetch
    const friends = await getFriends(me.id)

    return { ...me, friends }
  }
)

export const useUserCommonFriends = defineBasicLoader(
  '/users/[id]',
  async route => {
    const user = await useUserData()
    const me = await useCurrentUserData()

    const friends = await getCommonFriends(user.id, me.id)
    return { ...me, commonFriends: { with: user, friends } }
  }
)
```

In the example above we are exporting multiple loaders but we don't need to care about the order in which they are called nor try optimizing them because **they are only called once and share the data**.

::: danger
**Caveat**: must call **and await** all nested loaders at the top of the parent loader (see `useUserData()` and `useCurrentUserData()`). You cannot put a different regular `await` in between. If you really need to await **anything that isn't a loader** in between, wrap the promise with `withDataContext()` to ensure the loader context is properly restored:

```ts{3}
export const useUserCommonFriends = defineBasicLoader(async (route) => {
  const user = await useUserData()
  await withContext(functionThatReturnsAPromise())
  const me = await useCurrentUserData()

  // ...
})
```

This allows nested loaders to be aware of their _parent loader_. This could probably be linted with an eslint plugin. It is similar to the problem `<script setup>` had before introducing the automatic `withAsyncContext()`. The same feature could be introduced (via a vite plugin) but will also have a performance cost. In the future, this _should_ be solved with the [async-context](https://github.com/tc39/proposal-async-context) proposal (stage 2).
:::
