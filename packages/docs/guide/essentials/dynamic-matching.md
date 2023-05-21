# Dynamic Route Matching with Params

<VueSchoolLink
  href="https://vueschool.io/lessons/dynamic-routes"
  title="Learn about dynamic route matching with params"
/>

Very often we will need to map routes with the given pattern to the same component. For example, we may have a `User` component which should be rendered for all users but with different user IDs. In Vue Router we can use a dynamic segment in the path to achieve that, we call that a _param_:

```js
const User = {
  template: '<div>User</div>',
}

// these are passed to `createRouter`
const routes = [
  // dynamic segments start with a colon
  { path: '/users/:id', component: User },
]
```

Now URLs like `/users/johnny` and `/users/jolyne` will both map to the same route.

A _param_ is denoted by a colon `:`. When a route is matched, the value of its _params_ will be exposed as `this.$route.params` in every component. Therefore, we can render the current user ID by updating `User`'s template to this:

```js
const User = {
  template: '<div>User {{ $route.params.id }}</div>',
}
```

You can have multiple _params_ in the same route, and they will map to corresponding fields on `$route.params`. Examples:

| pattern                        | matched path             | \$route.params                           |
| ------------------------------ | ------------------------ | ---------------------------------------- |
| /users/:username               | /users/eduardo           | `{ username: 'eduardo' }`                |
| /users/:username/posts/:postId | /users/eduardo/posts/123 | `{ username: 'eduardo', postId: '123' }` |

In addition to `$route.params`, the `$route` object also exposes other useful information such as `$route.query` (if there is a query in the URL), `$route.hash`, etc. You can check out the full details in the [API Reference](../../api/#routelocationnormalized).

A working demo of this example can be found [here](https://codesandbox.io/s/route-params-vue-router-examples-mlb14?from-embed&initialpath=%2Fusers%2Feduardo%2Fposts%2F1).

<!-- <iframe
  src="https://codesandbox.io/embed//route-params-vue-router-examples-mlb14?fontsize=14&theme=light&view=preview&initialpath=%2Fusers%2Feduardo%2Fposts%2F1"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Route Params example"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe> -->

## Reacting to Params Changes

<VueSchoolLink
  href="https://vueschool.io/lessons/reacting-to-param-changes"
  title="Learn how to react to param changes"
/>

One thing to note when using routes with params is that when the user navigates from `/users/johnny` to `/users/jolyne`, **the same component instance will be reused**. Since both routes render the same component, this is more efficient than destroying the old instance and then creating a new one. **However, this also means that the lifecycle hooks of the component will not be called**.

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

Or, use the `beforeRouteUpdate` [navigation guard](../advanced/navigation-guards.md), which also allows to cancel the navigation:

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

<VueSchoolLink
  href="https://vueschool.io/lessons/404-not-found-page"
  title="Learn how to make a catch all/404 not found route"
/>

Regular params will only match characters in between url fragments, separated by `/`. If we want to match **anything**, we can use a custom _param_ regexp by adding the regexp inside parentheses right after the _param_:

```js
const routes = [
  // will match everything and put it under `$route.params.pathMatch`
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  // will match anything starting with `/user-` and put it under `$route.params.afterUser`
  { path: '/user-:afterUser(.*)', component: UserGeneric },
]
```

In this specific scenario, we are using a [custom regexp](./route-matching-syntax.md#custom-regexp-in-params) between parentheses and marking the `pathMatch` param as [optionally repeatable](./route-matching-syntax.md#optional-parameters). This allows us to directly navigate to the route if we need to by splitting the `path` into an array:

```js
this.$router.push({
  name: 'NotFound',
  // preserve current path and remove the first char to avoid the target URL starting with `//`
  params: { pathMatch: this.$route.path.substring(1).split('/') },
  // preserve existing query and hash if any
  query: this.$route.query,
  hash: this.$route.hash,
})
```

See more in the [repeated params](./route-matching-syntax.md#repeatable-params) section.

If you are using [History mode](./history-mode.md), make sure to follow the instructions to correctly configure your server as well.

## Advanced Matching Patterns

Vue Router uses its own path matching syntax, inspired by the one used by `express`, so it supports many advanced matching patterns such as optional params, zero or more / one or more requirements, and even custom regex patterns. Please check the [Advanced Matching](./route-matching-syntax.md) documentation to explore them.
