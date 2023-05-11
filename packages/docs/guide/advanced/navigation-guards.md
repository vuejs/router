# Navigation Guards

<VueSchoolLink
  href="https://vueschool.io/lessons/route-guards"
  title="Learn how to add navigation guards"
/>

As the name suggests, the navigation guards provided by Vue router are primarily used to guard navigations either by redirecting it or canceling it. There are a number of ways to hook into the route navigation process: globally, per-route, or in-component.

## Global Before Guards

You can register global before guards using `router.beforeEach`:

```js
const router = createRouter({ ... })

router.beforeEach((to, from) => {
  // ...
  // explicitly return false to cancel the navigation
  return false
})
```

Global before guards are called in creation order, whenever a navigation is triggered. Guards may be resolved asynchronously, and the navigation is considered **pending** before all hooks have been resolved.

Every guard function receives two arguments:

- **`to`**: the target route location [in a normalized format](../../api/#routelocationnormalized) being navigated to.
- **`from`**: the current route location [in a normalized format](../../api/#routelocationnormalized) being navigated away from.

And can optionally return any of the following values:

- `false`: cancel the current navigation. If the browser URL was changed (either manually by the user or via back button), it will be reset to that of the `from` route.
- A [Route Location](../../api/#routelocationraw): Redirect to a different location by passing a route location as if you were calling [`router.push()`](../../api/#push), which allows you to pass options like `replace: true` or `name: 'home'`. The current navigation is dropped and a new one is created with the same `from`.

  ```js
  router.beforeEach(async (to, from) => {
    if (
      // make sure the user is authenticated
      !isAuthenticated &&
      // ❗️ Avoid an infinite redirect
      to.name !== 'Login'
    ) {
      // redirect the user to the login page
      return { name: 'Login' }
    }
  })
  ```

It's also possible to throw an `Error` if an unexpected situation was met. This will also cancel the navigation and call any callback registered via [`router.onError()`](../../api/#onerror).

If nothing, `undefined` or `true` is returned, **the navigation is validated**, and the next navigation guard is called.

All of the things above **work the same way with `async` functions** and Promises:

```js
router.beforeEach(async (to, from) => {
  // canUserAccess() returns `true` or `false`
  const canAccess = await canUserAccess(to)
  if (!canAccess) return '/login'
})
```

### Optional third argument `next`

In previous versions of Vue Router, it was also possible to use a _third argument_ `next`, this was a common source of mistakes and went through an [RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0037-router-return-guards.md#motivation) to remove it. However, it is still supported, meaning you can pass a third argument to any navigation guard. In that case, **you must call `next` exactly once** in any given pass through a navigation guard. It can appear more than once, but only if the logical paths have no overlap, otherwise the hook will never be resolved or produce errors. Here is **a bad example** of redirecting the user to `/login` if they are not authenticated:

```js
// BAD
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' })
  // if the user is not authenticated, `next` is called twice
  next()
})
```

Here is the correct version:

```js
// GOOD
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' })
  else next()
})
```

## Global Resolve Guards

You can register a global guard with `router.beforeResolve`. This is similar to `router.beforeEach` because it triggers on **every navigation**, but resolve guards are called right before the navigation is confirmed, **after all in-component guards and async route components are resolved**. Here is an example that ensures the user has given access to the Camera for routes that [have defined a custom meta](./meta.md) property `requiresCamera`:

```js
router.beforeResolve(async to => {
  if (to.meta.requiresCamera) {
    try {
      await askForCameraPermission()
    } catch (error) {
      if (error instanceof NotAllowedError) {
        // ... handle the error and then cancel the navigation
        return false
      } else {
        // unexpected error, cancel the navigation and pass the error to the global handler
        throw error
      }
    }
  }
})
```

`router.beforeResolve` is the ideal spot to fetch data or do any other operation that you want to avoid doing if the user cannot enter a page.

<!-- TODO: how to combine with [`meta` fields](./meta.md) to create a [generic fetching mechanism](#TODO). -->

## Global After Hooks

You can also register global after hooks, however unlike guards, these hooks do not get a `next` function and cannot affect the navigation:

```js
router.afterEach((to, from) => {
  sendToAnalytics(to.fullPath)
})
```

<!-- TODO: maybe add links to examples -->

They are useful for analytics, changing the title of the page, accessibility features like announcing the page and many other things.

They also reflect [navigation failures](./navigation-failures.md) as the third argument:

```js
router.afterEach((to, from, failure) => {
  if (!failure) sendToAnalytics(to.fullPath)
})
```

Learn more about navigation failures on [its guide](./navigation-failures.md).

## Global injections within guards

Since Vue 3.3, it is possible to use `inject()` within navigation guards. This is useful for injecting global properties like the [pinia stores](https://pinia.vuejs.org). Anything that is provided with `app.provide()` is also accessible within `router.beforeEach()`, `router.beforeResolve()`, `router.afterEach()`:

```ts
// main.ts
const app = createApp(App)
app.provide('global', 'hello injections')

// router.ts or main.ts
router.beforeEach((to, from) => {
  const global = inject('global') // 'hello injections'
  // a pinia store
  const userStore = useAuthStore()
  // ...
})
```

## Per-Route Guard

You can define `beforeEnter` guards directly on a route's configuration object:

```js
const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: (to, from) => {
      // reject the navigation
      return false
    },
  },
]
```

`beforeEnter` guards **only trigger when entering the route**, they don't trigger when the `params`, `query` or `hash` change e.g. going from `/users/2` to `/users/3` or going from `/users/2#info` to `/users/2#projects`. They are only triggered when navigating **from a different** route.

You can also pass an array of functions to `beforeEnter`, this is useful when reusing guards for different routes:

```js
function removeQueryParams(to) {
  if (Object.keys(to.query).length)
    return { path: to.path, query: {}, hash: to.hash }
}

function removeHash(to) {
  if (to.hash) return { path: to.path, query: to.query, hash: '' }
}

const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: [removeQueryParams, removeHash],
  },
  {
    path: '/about',
    component: UserDetails,
    beforeEnter: [removeQueryParams],
  },
]
```

Note it is possible to achieve a similar behavior by using [route meta fields](./meta.md) and [global navigation guards](#global-before-guards).

## In-Component Guards

Finally, you can directly define route navigation guards inside route components (the ones passed to the router configuration)

### Using the options API

You can add the following options to route components:

- `beforeRouteEnter`
- `beforeRouteUpdate`
- `beforeRouteLeave`

```js
const UserDetails = {
  template: `...`,
  beforeRouteEnter(to, from) {
    // called before the route that renders this component is confirmed.
    // does NOT have access to `this` component instance,
    // because it has not been created yet when this guard is called!
  },
  beforeRouteUpdate(to, from) {
    // called when the route that renders this component has changed, but this component is reused in the new route.
    // For example, given a route with params `/users/:id`, when we navigate between `/users/1` and `/users/2`,
    // the same `UserDetails` component instance will be reused, and this hook will be called when that happens.
    // Because the component is mounted while this happens, the navigation guard has access to `this` component instance.
  },
  beforeRouteLeave(to, from) {
    // called when the route that renders this component is about to be navigated away from.
    // As with `beforeRouteUpdate`, it has access to `this` component instance.
  },
}
```

The `beforeRouteEnter` guard does **NOT** have access to `this`, because the guard is called before the navigation is confirmed, thus the new entering component has not even been created yet.

However, you can access the instance by passing a callback to `next`. The callback will be called when the navigation is confirmed, and the component instance will be passed to the callback as the argument:

```js
beforeRouteEnter (to, from, next) {
  next(vm => {
    // access to component public instance via `vm`
  })
}
```

Note that `beforeRouteEnter` is the only guard that supports passing a callback to `next`. For `beforeRouteUpdate` and `beforeRouteLeave`, `this` is already available, so passing a callback is unnecessary and therefore _not supported_:

```js
beforeRouteUpdate (to, from) {
  // just use `this`
  this.name = to.params.name
}
```

The **leave guard** is usually used to prevent the user from accidentally leaving the route with unsaved edits. The navigation can be canceled by returning `false`.

```js
beforeRouteLeave (to, from) {
  const answer = window.confirm('Do you really want to leave? you have unsaved changes!')
  if (!answer) return false
}
```

### Using the composition API

If you are writing your component using the [composition API and a `setup` function](https://v3.vuejs.org/guide/composition-api-setup.html#setup), you can add update and leave guards through `onBeforeRouteUpdate` and `onBeforeRouteLeave` respectively. Please refer to the [Composition API section](./composition-api.md#navigation-guards) for more details.

## The Full Navigation Resolution Flow

1. Navigation triggered.
2. Call `beforeRouteLeave` guards in deactivated components.
3. Call global `beforeEach` guards.
4. Call `beforeRouteUpdate` guards in reused components.
5. Call `beforeEnter` in route configs.
6. Resolve async route components.
7. Call `beforeRouteEnter` in activated components.
8. Call global `beforeResolve` guards.
9. Navigation is confirmed.
10. Call global `afterEach` hooks.
11. DOM updates triggered.
12. Call callbacks passed to `next` in `beforeRouteEnter` guards with instantiated instances.
