# vue-router-next [![CircleCI](https://circleci.com/gh/vuejs/vue-router-next.svg?style=svg)](https://circleci.com/gh/vuejs/vue-router-next)

## Status: Beta

The current codebase has most of the existing features on Vue Router v3.x and is usable. It supports all the [merged RFCs](https://github.com/vuejs/rfcs/pulls?q=is%3Apr+is%3Amerged+label%3Arouter).

Since the library is still unstable **and because we want feedback** on bugs and missing features, **it will probably go through a few breaking changes**.

Check the [playground](https://github.com/vuejs/vue-router-next/tree/master/playground) or [e2e tests](https://github.com/vuejs/vue-router-next/tree/master/e2e/modal) for a usage example.

## Known issues

### Breaking changes compared to vue-router@3.x

- The `mode: 'history'` option has been replaced with a more flexible one named `history`:

  ```js
  import { createRouter, createWebHistory } from 'vue-router'
  // there is also createWebHashHistory and createMemoryHistory

  createRouter({
    history: createWebHistory(),
    routes: [],
  })
  ```

- `base` option is now passed as the first argument to `createWebHistory` (and other histories)
- Catch all routes (`/*`) must now be defined using a parameter with a custom regex: `/:catchAll(.*)`
- `router.match` and `router.resolve` are merged together into `router.resolve` with a slightly different signature. Check its typing through autocomplete or [Router's `resolve` method](https://github.com/vuejs/vue-router-next/blob/master/src/router.ts)
- `router.getMatchedComponents` is now removed as they can be retrieved from `router.currentRoute.value.matched`:
  ```js
  router.currentRoute.value.matched.flatMap(record =>
    Object.values(record.components)
  )
  ```
- If you use a `transition`, you may need to wait for the router to be _ready_ before mounting the app:
  ```js
  app.use(router)
  // Note: on Server Side, you need to manually push the initial location
  router.isReady().then(() => app.mount('#app'))
  ```
  Otherwise there will be an initial transition as if you provided the `appear` prop to `transition` because the router displays its initial location (nothing) and then displays the first location. This happens because navigations are all asynchronous now. **If you have navigation guards upon the initial navigation**, you might not want to block the app render until they are resolved.
- On SSR, you need to manually pass the appropriate history by using a ternary:
  ```js
  // router.js
  let history = isServer ? createMemoryHistory() : createWebHistory()
  let router = createRouter({ routes, history })
  // somewhere in your server-entry.js
  router.push(req.url) // request url
  router.isReady().then(() => {
    // resolve the request
  })
  ```
- The object returned in `scrollBehavior` is now similar to [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions): `x` is renamed to `left` and `y` is renamed to `top`.

### Typings

To make typings more consistent and expressive, some types have been renamed. Keep in mind these can change until stable release to ensure consistency. Some type properties might have changed as well.

| `vue-router@3` | `vue-router@4`          |
| -------------- | ----------------------- |
| RouteConfig    | RouteRecordRaw          |
| Location       | RouteLocation           |
| Route          | RouteLocationNormalized |

#### Improvements

These are technically breaking changes but they fix an inconsistent behavior.

- Pushing or resolving a non existent named route throws an error instead of navigating to `/` and displaying nothing.
- _resolving_(`router.resolve`) or _pushing_ (`router.push`) a location with missing params no longer warns and produces an invalid URL (`/`), but explicitly throws an Error instead.
- Empty children `path` does not append a trailing slash (`/`) anymore to make it consistent across all routes:
  - By default no route has a trailing slash but also works with a trailing slash
  - Adding `strict: true` to a route record or to the router options (alongside `routes`) will disallow an optional trailing slash
  - Combining `strict: true` with a trailing slash in your routes allows you to enforce a trailing slash in your routes. In the case of nested routes, make sure to add the trailing slash to the parent **and not the empty child**:
    ```js
    let routes = [
      {
        path: '/parent/',
        children: [{ path: '' }, { path: 'child1/' }, { path: 'child2/' }],
      },
    ]
    ```
  - To redirect the user to trailing slash routes (or the opposite), you can setup a `beforeEach` navigation guard that ensures the presence of a trailing slash:
    ```js
    router.beforeEach((to, from, next) => {
      if (to.path.endsWith('/')) next()
      else next({ path: to.path + '/', query: to.query, hash: to.hash })
    })
    ```
- Because of the change above, relative children path `redirect` on an empty path are not supported anymore. Use named routes instead:
  ```js
  // replace
  let routes = [
    {
      path: '/parent',
      children: [
        // this would now redirect to `/home` instead of `/parent/home`
        { path: '', redirect: 'home' },
        { path: 'home' },
      ],
    },
  ]
  // with
  let routes = [
    {
      path: '/parent',
      children: [
        { path: '', redirect: { name: 'home' } },
        { path: 'home', name: 'home' },
      ],
    },
  ]
  ```
  Note this will work if `path` was `/parent/` as the relative location `home` to `/parent/` is indeed `/parent/home` but the relative location of `home` to `/parent` is `/home`

## Contributing

See [Contributing Guide](https://github.com/vuejs/vue-router-next/blob/master/.github/contributing.md).
