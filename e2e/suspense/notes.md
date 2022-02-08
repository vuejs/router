# Suspense + Router View

- Ignore the log of navigation guards

When toggling between two routes (or components), if one is async and we are using Suspense around it, Suspense will display the current component until the pending one resolves. **This is the desired behavior**. Can we make it work the same for nested async components?

This is the [current code](https://github.com/nuxt/framework/blob/main/packages/pages/src/runtime/page.vue) for `<NuxtPage>`:

```vue
<template>
  <RouterView v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <!-- <keep-alive> -->
      <Suspense
        @pending="$nuxt.callHook('page:start')"
        @resolve="$nuxt.callHook('page:finish')"
      >
        <component :is="Component" :key="$route.path" />
      </Suspense>
      <!-- <keep-alive -->
    </transition>
  </RouterView>
</template>

<script>
export default {
  name: 'NuxtPage',
}
</script>
```

Right now it pretty much replaces `<RouterView>` in Nuxt apps, so it's used for nested pages as well

## Async Views not linked to navigation

Right now, the router will navigate to a location and only then, `async setup` will run. This can still be fine as users do not necessarily need to put fetching logic inside navigation (Although I think it makes more sense unless you are handling the loading state manually).

### Advantages

- Simplest code as it only requires changes in the `template`:
  ```html
  <RouterView v-slot="{ Component }">
    <Suspense @pending="pendingHandler" @resolve="resolveHandler">
      <component :is="Component" class="view" />
    </Suspense>
  </RouterView>
  ```
  `pendingHandler` and `resolveHandler` are completely optional
- Displays the previous view while the new one is pending

### Problems / Solutions

- Can't handle Nested Routes [#Problem 1](#problem-1)
- Route updates eagerly, which can be confusing and is different from fetching during navigation
  - This cannot be solved without [a proper integration with vue router](#onBeforeNavigation)
- Errors (technically Promise rejections) still try displaying the async component that failed
  - **Possible solutions**:
    - An `error` slot to let the user show something
    - Show (or rather stay with) the previous content if no `error` slot is provided because it's very likely to fail anyway and error something harder to debug because of initialized/inexistent properties
    - An `error` event

### Questions

- Is the `fallback` event really useful? Isn't `pending` enough? What is the point of knowing when `fallback` is displayed.
- Could we have a new nested pending event that lets us know when any nested suspense goes pending? Same for nested resolve and maybe error. These events would have to be emitted once if multiple nested suspense go pending at the same tick.

---

Right now the Router doesn't listen for any events coming from suspense. The e2e test in this folder is meant to listen and play around with a possible integration of Vue Router with Suspense.

## Use case

This is a more realistic scenario of data fetching in `async setup()`:

```js
export default {
  async setup() {
    const route = useRoute()
    // any error could be caught by navigation guards if we listen to `onErrorCaptured()
    const user = ref(await getUser(route.params.id))

    return { user }
  },
}
```

## Problem 1

Run the example with `yarn run dev:e2e` and go to [the suspense test page](http://localhost:8080/suspense). It has a few views that aren't async, nested views **without nested Suspense** and nested views **with nested suspense**.

All async operations take 1s to resolve. They can also reject by adding `?fail=yes` to the URL or by checking the only checkbox on the page.
The example is also displaying a fallback slot with a 500ms timeout to see it midway through the pending phase.

Right now, these behaviors are undesired:

- Going from `/nested/one` to `/nested/two` displays a blank view while nested two loads. It should display one and then _loading root_ instead while pending
- Going from `/nested/one` to `/async-foo` displays a blank view while async foo loads. It should display one instead before displaying _loading root_ while pending
- Going from `/nested-suspense/one` to `/foo-async` displays a blank view while foo async loads. It should display one before displaying _loading root_. It also creates a weird error `Invalid vnode type when creating vnode`:
  ```
  runtime-core.esm-bundler.js:38 [Vue warn]: Invalid vnode type when creating vnode: undefined.
  at <RouterView class="view" >
  at <PTVS onVnodeUnmounted=fn<onVnodeUnmounted> ref=Ref< <p>​Loading nested...​</p>​ > class="view" >
  at <RouterView>
  at <App>
  ```
- Going from `/foo-async` to `/nested-suspense/one` displays _loading nested_ right away instead of displaying foo async for 500ms (as if we were initially visiting)
- Going from `/nested-suspense/one` to `/nested/two` breaks the application by leaving a loading node there.

Ideas:

- Would it be possible to display the whole current tree when a child goes _pending_? We could still display their nested fallback slots if they have any
- Is this possible without using nested Suspense? I think it's fine to require users to use nested Suspense with nested views. It could be abstracted anyway (e.g. with NuxtPage).

## onBeforeNavigation

> ⚠️ : this is a different problem from the one above

This is an idea of integrating better with Suspense and having one single navigation guard that triggers on enter and update. It goes further and the idea is to move to more intuitive APIs and keep improving vue router. Right now, we can achieve something similar with a `router.beforeResolve()` hook and saving data in `to.meta` but it disconnects the asynchronous operation from the view component and therefore is limited and not intuitive.

### Needs

- Become part of navigation: the URL should not change until all `<Suspense>` resolve
- Allows the user to display a `fallback` slot and use the `timeout` prop to control when it appears. Note there could be a new RouterView Component that accept those slots and forward them to `Suspense`.
- Abort the navigation when async setup errors and trigger `router.onError()` but still display the current route
- It shouldn't change the existing behavior when unused

- **Should it also trigger when leaving?** I think it makes more sense for it to trigger only on entering or updating (cf the example below)

### API usage

```vue
<script setup>
import { onBeforeNavigation } from 'vue-router'
import { getUser } from './api'

/**
 * This is the component for /users/:id, it fetches the user information and display it.
 */
const user = ref()

await onBeforeNavigation(async (to, from) => {
  user.value = await getUser(to.params.id)
})
</script>
```

Let's consider these routes:

- Home `/`: Not Async
- User `/users/:id`: Async, should fetch the user data to display it

This would be the expected behavior:

- Going from `/` to `/users/1` (Entering):
  - Calls `getUser(1)` thanks to `onBeforeNavigation()`
  - Keeps Home (`/`) visible until it resolves or fails
  - resolves: finish navigation (triggers `afterEach()`), switch to `/users/1`, and display the view with the content ready
  - fails: triggers `router.onError()`, stays at Home
- Going from `/users/1` to `/users/2` (Updating):
  - Also calls `getUser(2)` thanks to `onBeforeNavigation()`
  - Keeps User 1 (`/users/1`) visible until resolves or fails
  - resolves: (same as above) switch to `/users/2` and display the view with the content ready
  - fails: triggers `router.onError()`, stays at User 1
- Going from `/users/2` to `/` (Leaving):
  - Directly goes to Home without calling `getUser()`

## Pros

- Fully integrates with the router navigation
  - Allows global loaders (progress bar) to be attached to `beforeEach()`, `afterEach()`, and `onError()`

## Cons

- Complex implementation
- Could be fragile and break easily too (?)

## Implementation

The implementation for this hook requires displaying multiple router views at the same time: the pending view we are navigating to and the current

- To avoid
- We need to wrap every component with Suspense (even nested ones)
- Multiple Suspenses can resolve but we need to wait for all of them to resolve
  - `onBeforeNavigation()` could increment a counter
  - Without it we can only support it in view components: we count `to.matched.length`

## Other notes

- RouterView could expose the `depth` (number) alongside `Component` and `route`. It is used to get the matched view from `route.matched[depth]`
