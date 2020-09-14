# Dynamic Route Matching with Params

Very often we will need to map routes with the given pattern to the same component. For example we may have a `User` component which should be rendered for all users but with different user IDs. In Vue Router we can use a dynamic segment in the path to achieve that, we call that a _param_:

```js
const User = {
  template: '<div>User</div>',
}

// these are passed to `createRouter`
const routes = [
  // dynamic segments start with a colon
  { path: '/user/:id', component: User },
]
```

Now URLs like `/user/johnny` and `/user/jolyne` will both map to the same route.

A _param_ is denoted by a colon `:`. When a route is matched, the value of its _params_ will be exposed as `this.$route.params` in every component. Therefore, we can render the current user ID by updating `User`'s template to this:

```js
const User = {
  template: '<div>User {{ $route.params.id }}</div>',
}
```

<!-- TODO: replace with codesandbox -->

You can check out a live example [here](https://jsfiddle.net/yyx990803/4xfa2f19/).

You can have multiple _params_ in the same route, and they will map to corresponding fields on `$route.params`. Examples:

| pattern                      | matched path           | \$route.params                           |
| ---------------------------- | ---------------------- | ---------------------------------------- |
| /user/:username              | /user/eduardo          | `{ username: 'eduardo' }`                |
| /user/:username/post/:postId | /user/eduardo/post/123 | `{ username: 'eduardo', postId: '123' }` |

In addition to `$route.params`, the `$route` object also exposes other useful information such as `$route.query` (if there is a query in the URL), `$route.hash`, etc. You can check out the full details in the [API Reference](../../api/#the-route-object).

## Reacting to Params Changes

One thing to note when using routes with params is that when the user navigates from `/user/johnny` to `/user/jolyne`, **the same component instance will be reused**. Since both routes render the same component, this is more efficient than destroying the old instance and then creating a new one. **However, this also means that the lifecycle hooks of the component will not be called**.

To react to params changes in the same component, you can simply watch anything on the `$route` object, in this scenario, the `$route.params`:

```js
const User = {
  template: '...',
  created() {
    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        // react to route changes...
      }
    )
  },
}
```

Or, use the `beforeRouteUpdate` [navigation guard](../advanced/navigation-guards.html), which also allows to cancel the navigation:

```js
const User = {
  template: '...',
  async beforeRouteUpdate(to, from) {
    // react to route changes...
    this.userData = await fetchUser(to.params.id)
  },
}
```

## Catch all / 404 Not found Route

Regular params will only match characters in between url fragments, separated by `/`. If we want to match **anything**, we can use a custom _param_ regexp by adding the regexp inside parentheses right after the _param_:

```js
const routes = [
  // will match everything and put it under `$route.params.pathMatch`
  { path: '/:pathMatch(.*)*', name: 'NotFound' },
  // will match anything starting with `/user-` and put it under `$route.params.afterUser`
  { path: '/user-:afterUser(.*)' },
]
```

In this specific scenario we are using a [custom regexp](/guide/advanced/path-matching.md#custom-regexp) between parentheses and marking the `pathMatch` param as [optionally repeatable](/guide/advanced/path-matching.md#zero-or-more). This is to allows us to directly navigate to the route if we need to by splitting the `path` into an array:

```js
this.$router.push({
  name: 'NotFound',
  params: { pathMatch: this.$route.path.split('/') },
})
```

See more in the [repeated params](/guide/advanced/path-matching.md#zero-or-more) section.

If you are using [History mode](./history-mode.md), make sure to follow the instructions to correctly configure your server as well.

## Advanced Matching Patterns

Vue Router uses its own path matching, inspired to the one used by `express`, so it supports many advanced matching patterns such as optional params, zero or more / one or more requirements, and even custom regex patterns. Please check the [Advanced Matching](../advanced/advanced-matching.md) documentation to explore them.
