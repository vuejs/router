# Navigation aware

Since the data fetching happens within a navigation guard, it's possible to control the navigation like in regular navigation guards:

- Thrown errors (or rejected Promises) cancel the navigation (same behavior as in a regular navigation guard) and are intercepted by [Vue Router's error handling](https://router.vuejs.org/api/interfaces/router.html#onerror)
- By returning a `NavigationResult`, you can redirect, cancel, or modify the navigation

Any other returned value is considered as the _resolved data_ and will appear in the `data` property.

## Controlling the navigation with `NavigationResult`

`NavigationResult` is a class that can be returned or thrown from a loader to _change_ the navigation. It accepts the same arguments as the [return value of a navigation guard](https://router.vuejs.org/guide/advanced/navigation-guards.html#Global-Before-Guards) **as long as it changes the navigation**. It doesn't accept `true` or `undefined` as these values do not change the navigation.

```ts{1,6-8,16,18}
import { NavigationResult } from 'vue-router/experimental'
import { defineBasicLoader } from 'vue-router/experimental'

export const useUserData = defineBasicLoader(
  async (to) => {
    // cancel the navigation for invalid IDs
    if (isInvalidId(to.params.id)) {
      return new NavigationResult(false)
    }

    try {
      const user = await getUserById(to.params.id)

      return user
    } catch (error) {
      if (error.status === 404) {
        return new NavigationResult({ name: 'not-found' })
      } else {
        throw error // aborts the router navigation
      }
    }
  }
)
```

### Handling multiple navigation results

Since navigation loaders can run in parallel, they can return different navigation results as well. In this case, you can decide which result should be used by providing a `selectNavigationResult()` method to the [`DataLoaderPlugin`](./index.md#installation):

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
// @errors: 2769
// @noErrors
app.use(DataLoaderPlugin, {
  router,
  selectNavigationResult(results) {
    for (const { value } of results) {
      // If any of the results is a redirection to the not-found page, use it
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

### Eagerly changing the navigation

If a loader wants to eagerly alter the navigation, it can `throw` the `NavigationResult` instead of returning it. This skips the `selectNavigationResult()` and take precedence without triggering `router.onError()`.

```ts{11-16}
import { NavigationResult } from 'vue-router/experimental'
import { defineBasicLoader } from 'vue-router/experimental'

export const useUserData = defineBasicLoader(
  async (to) => {
    try {
      const user = await getUserById(to.params.id)

      return user
    } catch (error) {
      throw new NavigationResult({
        name: 'not-found',
        // keep the current path in the URL
        params: { pathMatch: to.path.split('/') },
        query: to.query,
        hash: to.hash,
      })
    }
  }
)
```

## Consistent updates

During a navigation, data loaders are grouped together like a _pack_. If the navigation is canceled, none of the results are used. This avoids having partial data updates in a page and inconsistencies between the URL and the page content. On the other hand, if the navigation is successful, all the data loaders are resolved together and the data is only updated **once all the loaders are resolved**. This is true even for lazy loaders. This ensures that even if you have loaders that are really fast, the old data is not displayed until all the loaders are resolved and the new data is completely ready to be displayed.

## Lazy loaders

Apart from consistent updates, lazy loaders are not navigation-aware. They cannot control the navigation with errors or `NavigationResult`. They still start loading as soon as the navigation is initiated.

## Loading after the navigation

It's possible to not start loading the data until the navigation is done. To do this, simply [**do not attach the loader to the page**](./defining-loaders.md#disconnecting-a-loader-from-a-page). It will eventually start loading when the page is mounted.
