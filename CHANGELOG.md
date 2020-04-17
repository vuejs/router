# [4.0.0-alpha.6](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2020-04-17)


### Bug Fixes

* **history:** allow base with / and base tag ([d7c71b5](https://github.com/vuejs/vue-router-next/commit/d7c71b55ee4a11ecaf3a72f25eb126d118829d3f)), closes [#164](https://github.com/vuejs/vue-router-next/issues/164)
* **history:** allow hash history with no origin ([760d216](https://github.com/vuejs/vue-router-next/commit/760d21672051b6338d40f2cdfdac80dc16209e13)), closes [#163](https://github.com/vuejs/vue-router-next/issues/163)
* **scroll:** only apply on browser ([cf53192](https://github.com/vuejs/vue-router-next/commit/cf53192b77d619b1e43c8decda76d4083d9c17ea))
* revert history navigation if navigation is cancelled ([d8a0d11](https://github.com/vuejs/vue-router-next/commit/d8a0d117dbede9b177f06c8ebab201d12dfca0c0))


### Code Refactoring

* **router:** merge createHref into resolve ([66b2db9](https://github.com/vuejs/vue-router-next/commit/66b2db95b6b73433dc3abbe6c6f7f07959429d78))


### Features

* add this.$route ([92dc18d](https://github.com/vuejs/vue-router-next/commit/92dc18d448ffeb57d9b3f3b303b8ec2991175eb5))
* add this.$router ([1807f30](https://github.com/vuejs/vue-router-next/commit/1807f301053ac93db1e50991f67dcf532990d5c9))
* **scroll:** handle scroll on popstate ([181efe9](https://github.com/vuejs/vue-router-next/commit/181efe9f29a200b03e2d8f4759e7854047936824))
* merge meta fields ([72a052f](https://github.com/vuejs/vue-router-next/commit/72a052fdf4a198e3ac72779f1b7b8b80d0ac018d))
* **guards:** support errors in navigation guards ([23ed08d](https://github.com/vuejs/vue-router-next/commit/23ed08d983f308b7b118f2a235e58d29bf1994ec))
* **router:** hasRoute ([ca02444](https://github.com/vuejs/vue-router-next/commit/ca02444c91c8f6b21caf6a71dee5d0f2e3f7e51b))


### Reverts

* Revert "test: only call browser.end on the last test" ([d3221f1](https://github.com/vuejs/vue-router-next/commit/d3221f16978186b09531f7ea0cb5b92b20147181))


### BREAKING CHANGES

* **router:** createHref is removed from the router. Instead, resolve
returns a location object with the corresponding `href` property



# [4.0.0-alpha.5](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2020-04-08)


### Bug Fixes

* **link:** not active when matched is empty ([acd644d](https://github.com/vuejs/vue-router-next/commit/acd644db70793da7719b321b2dcdd537ec358f9c))
* check query and hash when navigating ([3862ad9](https://github.com/vuejs/vue-router-next/commit/3862ad924bbc734a835577c3a3c71bc3550db29c))
* ignore order of keys in query and params ([643bd15](https://github.com/vuejs/vue-router-next/commit/643bd15ceaf9d6314434b15b169171b599b58e1c))
* skip initial guards with static redirect ([c76bb93](https://github.com/vuejs/vue-router-next/commit/c76bb938a2c9a1790be98b6ce44ccd153a342141))
* **types:** add missing exported types ([ec241f7](https://github.com/vuejs/vue-router-next/commit/ec241f7a93107815d9ffd25d36cbf00b47cb7318)), closes [#147](https://github.com/vuejs/vue-router-next/issues/147)


### Features

* allow symbols as route record name ([f42ab3f](https://github.com/vuejs/vue-router-next/commit/f42ab3fecfaecddcef0ccf8bb0f7f44ca24d6160))
* **link:** activeClass and exactActiveClass props ([d53b383](https://github.com/vuejs/vue-router-next/commit/d53b3832b50131cb83b8c567015780e60addb6c8))
* **link:** allow `custom` prop ([874510b](https://github.com/vuejs/vue-router-next/commit/874510be69c3b068970e8a90ae251cf487d6acf9))


### BREAKING CHANGES

* Renamed types by removing suffix Normalized and using Raw instead
  - `RouteLocation` -> `RouteLocationRaw`
  - `RouteLocationNormalized` -> `RouteLocation`
  - `RouteLocationNormalized` is now a location that can be displayed (not a static redirect)
  - `RouteLocationNormalizedResolved` -> `RouteLocationNormalizedLoaded`
  - `RouteRecord` -> `RouteRecordRaw`
  - `RouteRecordNormalized` -> `RouteRecord`
  - `RouteRecordNormalized` is now a record that is not a static redirect



# [4.0.0-alpha.4](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2020-03-28)


### Bug Fixes

* **history:** use current history state when replacing ([5d80209](https://github.com/vuejs/vue-router-next/commit/5d802094923851102557bfb2583835cc135e16b8))
* export more types ([1583d48](https://github.com/vuejs/vue-router-next/commit/1583d480fff2da1caa35c2dd7892c36b57dad734)), closes [#137](https://github.com/vuejs/vue-router-next/issues/137)
* **guards:** free instances only if navigation is confirmed ([d0514e1](https://github.com/vuejs/vue-router-next/commit/d0514e192839c54c4181f80286602e9d37459f4d))
* **hash:** fix base position for hash routing ([ba40b8f](https://github.com/vuejs/vue-router-next/commit/ba40b8f0cf2d6d85533e0e7e7daaadd088298f19))
* initial location with base ([d05208b](https://github.com/vuejs/vue-router-next/commit/d05208b6c9457931bda8205ba6d9f1d5e39a54c7))
* **router:** prevent duplicated navigation on aliases ([e825586](https://github.com/vuejs/vue-router-next/commit/e82558684c0b6b688065032df65604b2c245d395))


### Features

* allow passing state to history ([ac1c96f](https://github.com/vuejs/vue-router-next/commit/ac1c96f176dcad8aac03a86a1dccfbaab4b66520))
* improve route access ([baf266c](https://github.com/vuejs/vue-router-next/commit/baf266cd1bd6cafd32d244f185e340bee10af32c))
* **history:** expose state on html5 ([3f83607](https://github.com/vuejs/vue-router-next/commit/3f83607c8798960f49cdb5eed8fdfe8adc52fabf))
* **matcher:** remove aliases alongside the original record ([26b71b2](https://github.com/vuejs/vue-router-next/commit/26b71b285b743ab8af94b9297fa7037872ae0de6))
* **router:** support custom parseQuery and stringifyQuery ([#136](https://github.com/vuejs/vue-router-next/issues/136)) ([5dce7bc](https://github.com/vuejs/vue-router-next/commit/5dce7bcbfbb4a80bd1edbe061a250fa646f2afd7))
* **view:** add props option as boolean ([7fe1e7d](https://github.com/vuejs/vue-router-next/commit/7fe1e7dc7406bddd0924bf7f01709b9113582472))
* **view:** allow passing props as a function ([494fc5e](https://github.com/vuejs/vue-router-next/commit/494fc5efb6add93c68ed467bb9a8dc7b3b149fff))
* **view:** useView to customize router-view ([06b0c34](https://github.com/vuejs/vue-router-next/commit/06b0c34ee5018aa9d76c0bfcd32ff2c12cd94277))
* allow true in `next` ([d76c6aa](https://github.com/vuejs/vue-router-next/commit/d76c6aae115110e2d9c4c072748bd9403080c8bd))
* invoke guards with the right context ([7053413](https://github.com/vuejs/vue-router-next/commit/7053413c93bc715d5c2179378367dc12f60a118d))
* lazy loading ([6ecdc70](https://github.com/vuejs/vue-router-next/commit/6ecdc70baa6361b8614368196ff2652560b6a0ba))
* **view:** allow props as object in record ([fd4dc06](https://github.com/vuejs/vue-router-next/commit/fd4dc0630bdf856f972ed6e9020b70a70ac582b4))


### BREAKING CHANGES

* `useRoute` now retrieves a reactive RouteLocationNormalized instead of a Ref<RouteLocationNormalized>.
  This means there is no need to use `.value` when accessing the route. You still need to wrap it with `toRefs` if you want to expose parts of the route:
  ```js
  setup () {
    return { params: toRefs(useRoute()).params }
  }
  ```



# [4.0.0-alpha.3](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2020-03-14)

### Bug Fixes

- add missing type definitions

# [4.0.0-alpha.2](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2020-03-14)

### Bug Fixes

- **history:** correct url when replacing current location ([704b45e](https://github.com/vuejs/vue-router-next/commit/704b45ea52b10099a765c93ced37d03393a72d17))
- **link:** allow attrs to override behavior ([4cae9db](https://github.com/vuejs/vue-router-next/commit/4cae9dbede993a79577691e1df4444a8fe5ca3a0))
- **link:** allow custom classes ([#134](https://github.com/vuejs/vue-router-next/issues/134)) ([392c295](https://github.com/vuejs/vue-router-next/commit/392c295552e5b7dbe1d494c1c3168571e3339153)), closes [#133](https://github.com/vuejs/vue-router-next/issues/133)
- **link:** navigate to the alias path ([3284110](https://github.com/vuejs/vue-router-next/commit/328411079e1aa8a5dc3903ae76a55d634946d9fd))
- **link:** non active repeatable params ([0ccbc1e](https://github.com/vuejs/vue-router-next/commit/0ccbc1e9af07a30a149ab14c007f63cbc35a8126))

### Features

- add aliasOf to normalized records ([d9f3174](https://github.com/vuejs/vue-router-next/commit/d9f31748802c39572254691108b0667cfd40e911))
- handle active/exact in Link ([6f49dce](https://github.com/vuejs/vue-router-next/commit/6f49dcea35a63785ae08d08787913ab8391cae67))
- **matcher:** link aliases to their original record ([e9eb648](https://github.com/vuejs/vue-router-next/commit/e9eb6481e21de61080a96f66fbd8640157d0fd27))

# [4.0.0-alpha.1](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.0...v4.0.0-alpha.1) (2020-02-26)

### Code Refactoring

- rename createHistory and createHashHistory ([7dbebb6](https://github.com/vuejs/vue-router-next/commit/7dbebb6e2d75ab4aa77019712f2ed251ad62464f))

### Features

- add dynamic routing at router level ([a7943c6](https://github.com/vuejs/vue-router-next/commit/a7943c64383bced7ff90ae92c0498827acdb71f6))

### BREAKING CHANGES

- `createHistory` is now named `createWebHistory`.
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
