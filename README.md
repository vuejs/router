# vue-router-next [![CircleCI](https://circleci.com/gh/vuejs/vue-router-next.svg?style=svg)](https://circleci.com/gh/vuejs/vue-router-next)

## Status: Alpha

The current codebase has most of the existing features on Vue Router v3.x and is usable. It supports all the [merged RFCs](https://github.com/vuejs/rfcs/pulls?q=is%3Apr+is%3Amerged+label%3Arouter).

Since the library is still unstable **and because we want feedback** on bugs and missing features, **it will probably go through a few breaking changes**.

## Known issues

### Breaking changes compared to vue-router@3.x

- `mode: 'history'` -> `history: createWebHistory()`
- `base` option is now passed as the first argument to `createWebHistory` (and other histories)
- Catch all routes (`/*`) must now be defined using a parameter with a custom regex: `/:catchAll(.*)`
- `router.match` and `router.resolve` are merged together into `router.resolve` with a slightly different signature
- `router.getMatchedComponents` is now removed as they can be retrieved from `router.currentRoute.value.matched`:
  ```js
  router.currentRoute.value.matched
    .map(record => Object.values(record.components))
    .flat()
  ```
- _resolving_(`router.resolve`) or _pushing_ (`router.push`) a location with missing params no longer warns and produces an invalid URL, but throws an Error instead
- Relative children path `redirect` are not supported. Use named routes instead:
  ```js
  // replace
  let routes = {
    path: '/parent/',
    children: [{ path: '', redirect: 'home' }, { path: 'home' }],
  }
  // with
  let routes = {
    path: '/parent/',
    children: [
      { path: '', redirect: { name: 'home' } },
      { path: 'home', name: 'home' },
    ],
  }
  ```

#### Improvements

These are technically breaking changes but they fix an inconsistent behavior.

- Pushing or resolving a non existent named route throws an error instead of navigating to `/` and displaying nothing.

### Missing features

- `KeepAlive` is only partially supported. Namely, the context (`this`) is not working properly
- Partial support of per-component navigation guards. `beforeRouteEnter` doesn't invoke its callback

## Contributing

See [Contributing Guide](https://github.com/vuejs/vue-router-next/blob/master/.github/contributing.md).
