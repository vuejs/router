# vue-router-next [![CircleCI](https://circleci.com/gh/vuejs/vue-router-next.svg?style=svg)](https://circleci.com/gh/vuejs/vue-router-next)

## Status: Alpha

The current codebase has most of the existing features on Vue Router v3.x and is usable. It supports all the [merged RFCs](https://github.com/vuejs/rfcs/pulls?q=is%3Apr+is%3Amerged+label%3Arouter).

Since the library is still unstable **and because we want feedback** on bugs and missing features, **it will probably go through a few breaking changes**.

## Known issues

### Breaking changes compared to vue-router@3.x

- `mode: 'history'` -> `history: createWebHistory()`
- Catch all routes (`/*`) must now be defined using a parameter with a custom regex: `/:catchAll(.*)`

### Missing features

- `keep-alive` is not yet supported
- Partial support of per-component navigation guards. No `beforeRouteEnter`

## Contributing

See [Contributing Guide](https://github.com/vuejs/vue-router-next/blob/master/.github/contributing.md).
