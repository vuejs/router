# [4.0.0-alpha.1](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.0...v4.0.0-alpha.1) (2020-02-26)


### Code Refactoring

* rename createHistory and createHashHistory ([7dbebb6](https://github.com/vuejs/vue-router-next/commit/7dbebb6e2d75ab4aa77019712f2ed251ad62464f))


### Features

* add dynamic routing at router level ([a7943c6](https://github.com/vuejs/vue-router-next/commit/a7943c64383bced7ff90ae92c0498827acdb71f6))


### BREAKING CHANGES

* `createHistory` is now named `createWebHistory`.
`createHashHistory` is now named `createWebHashHistory`.

  Both createHistory and createHashHistory are renamed to
  better reflect that they must be used in a browser environment while
  createMemoryHistory doesn't.



# [4.0.0-alpha.0](https://github.com/vuejs/vue-router-next/compare/v0.0.11...v4.0.0-alpha.0) (2020-02-26)

## Known issues

### Breaking changes compared to vue-router@3.x

- `mode: 'history'` -> `history: createHistory()`
- Catch all routes (`/*`) must now be defined using a parameter with a custom regex: `/:catchAll(.*)`

### Missing features

- `keep-alive` is not yet supported
- Partial support of per-component navigation guards. No `beforeRouteEnter` yet
