# [4.0.0-alpha.3](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2020-03-14)



# [4.0.0-alpha.2](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2020-03-14)


### Bug Fixes

* **history:** correct url when replacing current location ([704b45e](https://github.com/vuejs/vue-router-next/commit/704b45ea52b10099a765c93ced37d03393a72d17))
* **link:** allow attrs to override behavior ([4cae9db](https://github.com/vuejs/vue-router-next/commit/4cae9dbede993a79577691e1df4444a8fe5ca3a0))
* **link:** allow custom classes ([#134](https://github.com/vuejs/vue-router-next/issues/134)) ([392c295](https://github.com/vuejs/vue-router-next/commit/392c295552e5b7dbe1d494c1c3168571e3339153)), closes [#133](https://github.com/vuejs/vue-router-next/issues/133)
* **link:** navigate to the alias path ([3284110](https://github.com/vuejs/vue-router-next/commit/328411079e1aa8a5dc3903ae76a55d634946d9fd))
* **link:** non active repeatable params ([0ccbc1e](https://github.com/vuejs/vue-router-next/commit/0ccbc1e9af07a30a149ab14c007f63cbc35a8126))


### Features

* add aliasOf to normalized records ([d9f3174](https://github.com/vuejs/vue-router-next/commit/d9f31748802c39572254691108b0667cfd40e911))
* handle active/exact in Link ([6f49dce](https://github.com/vuejs/vue-router-next/commit/6f49dcea35a63785ae08d08787913ab8391cae67))
* **matcher:** link aliases to their original record ([e9eb648](https://github.com/vuejs/vue-router-next/commit/e9eb6481e21de61080a96f66fbd8640157d0fd27))



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
