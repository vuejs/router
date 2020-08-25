# Navigation Guards

As the name suggests, the navigation guards provided by Vue router are primarily used to guard navigations either by redirecting it or canceling it. There are a number of ways to hook into the route navigation process: globally, per-route, or in-component.

## Global Before Guards

You can register global before guards using `router.beforeEach`:

```js
const router = createRouter({ ... })

router.beforeEach((to, from, next) => {
  // ...
  next()
})
```

Global before guards are called in creation order, whenever a navigation is triggered. Guards may be resolved asynchronously, and the navigation is considered **pending** before all hooks have been resolved.

Every guard function receives three arguments:

- **`to`**: the target [Normalized RouteLocation](../../api/#the-route-object) being navigated to.

- **`from`**: the current route location (same type as `to`) being navigated away from.

- **`next`**: a function that **must be called to resolve** the hook. The action depends on the arguments provided to `next`:

  - **`next()`**: move on to the next hook in the pipeline. If no hooks are left, the navigation is **validated**.

  - **`next(false)`**: cancel the current navigation. If the browser URL was changed (either manually by the user or via back button), it will be reset to that of the `from` route.

  - **`next('/')` or `next({ path: '/' })`**: redirect to a different location. The current navigation will be dropped and a new one will be initiated. **You can pass any route location object** to `next`, which allows you to specify options like `replace: true`, `name: 'home'` and any option used in [`router-link`'s `to` prop](../../api/#to) or [`router.push`](../../api/#router-push)

  - **`next(error)`**: (2.4.0+) if the argument passed to `next` is an instance of `Error`, the navigation will be canceled and the error will be passed to callbacks registered via [`router.onError()`](../../api/#router-onerror). The same happens if an error is directly thrown.

::: tip Note
For all guards, **make sure that the `next` function is called exactly once** in any given pass through the navigation guard. It can appear more than once, but only if the logical paths have no overlap, otherwise the hook will never be resolved or produce errors. Here is an example of redirecting to user to `/login` if they are not authenticated:

```js
// BAD
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' })
  // if the user is not authenticated, `next` is called twice
  next()
})
```

```js
// GOOD
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' })
  else next()
})
```

:::

## Global Resolve Guards

You can register a global guard with `router.beforeResolve`. This is similar to `router.beforeEach` because it triggers on **every navigation**, but resolve guards are called right before the navigation is confirmed, **after all in-component guards and async route components are resolved**. This is the ideal spot to fetch data or do any other operation that you want to avoid doing if the user cannot enter a page. It's also very easy to combine with [`meta` fields](./meta.md) to create a [generic fetching mechanism](../../cookbook/generic-data-fetching.md):

```js
router.beforeResolve(async (to, from, next) => {
  if (to.meta.requiresCamera) {
    try {
      await askForCameraPermission()
      next()
    } catch (error) {
      if (error instanceof NotAllowedError) {
        // ... handle the error and then cancel the navigation
        next(false)
      } else {
        // unexpected error, cancel the navigation and pass the error to the global handler
        next(error)
      }
    }
  } else {
    // make sure to always call `next`
    next()
  }
})
```

## Global After Hooks

You can also register global after hooks, however unlike guards, these hooks do not get a `next` function and cannot affect the navigation:

```js
router.afterEach((to, from) => {
  sendToAnalytics(to.fullPath)
})
```

They are useful for analytics, [changing the title of the page](../../cookbook/page-title.md), [accessibility](../../cookbook/announcing-navigation.md) and many other things.

## Per-Route Guard

You can define `beforeEnter` guards directly on a route's configuration object:

```js
const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: (to, from, next) => {
      // ...
      next()
    }
  }
]
```

`beforeEnter` guards **only trigger when entering the route**, they don't trigger when the `params`, `query` or `hash` change e.g. going from `/users/2` to `/users/3` or going from `/users/2#info` to `/users/2#projects`. They are only triggered when navigating **from a different** route.

## In-Component Guards

Finally, you can directly define route navigation guards inside route components (the ones passed to the router configuration) with the following options:

- `beforeRouteEnter`
- `beforeRouteUpdate`
- `beforeRouteLeave`

```js
const UserDetails = {
  template: `...`,
  beforeRouteEnter(to, from, next) {
    // called before the route that renders this component is confirmed.
    // does NOT have access to `this` component instance,
    // because it has not been created yet when this guard is called!
  },
  beforeRouteUpdate(to, from, next) {
    // called when the route that renders this component has changed,
    // but this component is reused in the new route.
    // For example, given a route with params `/users/:id`, when we
    // navigate between `/users/1` and `/users/2`, the same `UserDetails` component instance
    // will be reused, and this hook will be called when that happens.
    // Because the component is mounted while this happens, the navigation guard has access to `this` component instance.
  },
  beforeRouteLeave(to, from, next) {
    // called when the route that renders this component is about to
    // be navigated away from.
    // As with `beforeRouteUpdate`, it has access to `this` component instance.
  }
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
beforeRouteUpdate (to, from, next) {
  // just use `this`
  this.name = to.params.name
  next()
}
```

The **leave guard** is usually used to prevent the user from accidentally leaving the route with unsaved edits. The navigation can be canceled by calling `next(false)`.

```js
beforeRouteLeave (to, from, next) {
  const answer = window.confirm('Do you really want to leave? you have unsaved changes!')
  if (answer) {
    next()
  } else {
    next(false)
  }
}
```

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
