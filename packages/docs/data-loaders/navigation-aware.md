# Navigation aware

Since the data fetching happens within a navigation guard, it's possible to control the navigation like in regular navigation guards:

- Thrown errors (or rejected Promises) cancel the navigation (same behavior as in a regular navigation guard) and are intercepted by [Vue Router's error handling](https://router.vuejs.org/api/interfaces/router.html#onerror)
- By calling `reroute()`, you can redirect or cancel the navigation

Any other returned value is considered as the _resolved data_ and will appear in the `data` property.

## Controlling the navigation with `reroute()`

`reroute()` changes the current navigation from within a data loader. It accepts the same arguments as the [return value of a navigation guard](https://router.vuejs.org/guide/advanced/navigation-guards.html#Global-Before-Guards) **as long as it changes the navigation**. It doesn't accept `true` or `undefined` as these values do not change the navigation. It **throws internally** to immediately stop the loader execution.

```ts{1,6-8,16,18}
import { reroute } from 'vue-router/experimental'
import { defineBasicLoader } from 'vue-router/experimental'

export const useUserData = defineBasicLoader(
  async (to) => {
    // cancel the navigation for invalid IDs
    if (isInvalidId(to.params.id)) {
      reroute(false)
    }

    try {
      const user = await getUserById(to.params.id)

      return user
    } catch (error) {
      if (error.status === 404) {
        reroute({ name: 'not-found' })
      } else {
        throw error // aborts the router navigation
      }
    }
  }
)
```

::: tip

Since `reroute()` throws internally (its return type is `never`), you don't need to use `return` or `else` after calling it.

:::

## Consistent updates

During a navigation, data loaders are grouped together like a _pack_. If the navigation is canceled, none of the results are used. This avoids having partial data updates in a page and inconsistencies between the URL and the page content. On the other hand, if the navigation is successful, all the data loaders are resolved together and the data is only updated **once all the loaders are resolved**. This is true even for lazy loaders. This ensures that even if you have loaders that are really fast, the old data is not displayed until all the loaders are resolved and the new data is completely ready to be displayed.

## Lazy loaders

Apart from consistent updates, lazy loaders are not navigation-aware. They cannot control the navigation with errors or `reroute()`. They still start loading as soon as the navigation is initiated.

## Loading after the navigation

It's possible to not start loading the data until the navigation is done. To do this, simply [**do not attach the loader to the page**](./defining-loaders.md#disconnecting-a-loader-from-a-page). It will eventually start loading when the page is mounted.
