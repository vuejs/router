# [4.0.0-rc.6](https://github.com/vuejs/vue-router-next/compare/v4.0.0-rc.5...v4.0.0-rc.6) (2020-11-30)

### Bug Fixes

- **guards:** correctly reuse guards ([#616](https://github.com/vuejs/vue-router-next/issues/616)) ([95d44c8](https://github.com/vuejs/vue-router-next/commit/95d44c8ff2a961e052fd67b2160b87fb32d0ffb4)), closes [#614](https://github.com/vuejs/vue-router-next/issues/614)

### Features

- **devtools:** improve active + match in routes inspector ([9f59489](https://github.com/vuejs/vue-router-next/commit/9f59489f04cedfca5ba55da019b2dc790e926fd7))
- **types:** expose `LocationQueryValueRaw` as internal ([dc02850](https://github.com/vuejs/vue-router-next/commit/dc028500c3e931ed5fd6beedf58b5425f5115b52))

# [4.0.0-rc.5](https://github.com/vuejs/vue-router-next/compare/v4.0.0-rc.4...v4.0.0-rc.5) (2020-11-21)

### Features

- **scroll:** allow modifying scrollBehavior in options ([#602](https://github.com/vuejs/vue-router-next/issues/602)) ([d6651f5](https://github.com/vuejs/vue-router-next/commit/d6651f5f954c8ecaf1a77ec209d5aba06343e867))

# [4.0.0-rc.4](https://github.com/vuejs/vue-router-next/compare/v4.0.0-rc.3...v4.0.0-rc.4) (2020-11-20)

### Features

- expose symbols as internals ([ef62d96](https://github.com/vuejs/vue-router-next/commit/ef62d9645c456f069699480ae3f2c3dd97b9d30d))

# [4.0.0-rc.3](https://github.com/vuejs/vue-router-next/compare/v4.0.0-rc.2...v4.0.0-rc.3) (2020-11-14)

### Bug Fixes

- trigger redirect on popstate ([#592](https://github.com/vuejs/vue-router-next/issues/592)) ([18dbdc2](https://github.com/vuejs/vue-router-next/commit/18dbdc2745cf7bd2516d4576a8d6a21de78516ec))
- **query:** encode space as + ([4d3dd5f](https://github.com/vuejs/vue-router-next/commit/4d3dd5fd523cefc675aa7e61ed9b06b66e42b80c)), closes [#561](https://github.com/vuejs/vue-router-next/issues/561)

# [4.0.0-rc.2](https://github.com/vuejs/vue-router-next/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2020-11-05)

### Features

- expose injection symbols as internals ([0056aca](https://github.com/vuejs/vue-router-next/commit/0056aca5b251df2a18bab79e18874a18e0204b4d))
- **devtools:** add devtools plugin ([894d50d](https://github.com/vuejs/vue-router-next/commit/894d50d351a40df95a3227840f5485f7e8b90432))
- **devtools:** add more ([ee07302](https://github.com/vuejs/vue-router-next/commit/ee0730254522d6162114968e4d62b93e8b6f7f93))
- **devtools:** better search ([5d68a29](https://github.com/vuejs/vue-router-next/commit/5d68a29386f34363b38c4138fbeae01ec538285e))
- **devtools:** support multiple router instances ([2e5d0d4](https://github.com/vuejs/vue-router-next/commit/2e5d0d4d726ee6329745f34ca463a74820c5aa29))

# [4.0.0-rc.1](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.13...v4.0.0-rc.1) (2020-10-23)

### Features

- **warn:** improve warning for invalid components ([5985b65](https://github.com/vuejs/vue-router-next/commit/5985b6560d40412d67311df10343ee6a119a0535)), closes [#517](https://github.com/vuejs/vue-router-next/issues/517)

# [4.0.0-beta.13](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.12...v4.0.0-beta.13) (2020-10-02)

### Bug Fixes

- **encoding:** decode hash in string location ([11acb3d](https://github.com/vuejs/vue-router-next/commit/11acb3dea072592f00a23b912d39c3fcf72dc6c3))
- **encoding:** differentiate keys and values in query ([a967e42](https://github.com/vuejs/vue-router-next/commit/a967e427ab3bc5c1e6236b01f484a87b74a92be1))
- **encoding:** keep decoded hash when resolving ([1a8ffc1](https://github.com/vuejs/vue-router-next/commit/1a8ffc19b0d2bfc17daec4cb04b96d174c73dd9d))
- **hash:** only pushState the hash part ([2a14c19](https://github.com/vuejs/vue-router-next/commit/2a14c19e4f0313996fd075a6821f85d30c5cad66)), closes [#495](https://github.com/vuejs/vue-router-next/issues/495)

### Features

- **warn:** help migrating catch all routes ([14e1eb9](https://github.com/vuejs/vue-router-next/commit/14e1eb96485f74669f582a87f522d3b13b567c9c))
- print errors from lazy loading ([f6db91a](https://github.com/vuejs/vue-router-next/commit/f6db91aaf496b85c80e74727575cc1c2b1d06282)), closes [#497](https://github.com/vuejs/vue-router-next/issues/497)

# [4.0.0-beta.12](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.11...v4.0.0-beta.12) (2020-09-25)

### Bug Fixes

- **types:** extend @vue/runtime-core module ([#473](https://github.com/vuejs/vue-router-next/issues/473)) ([556cd4b](https://github.com/vuejs/vue-router-next/commit/556cd4b4af3d7ac1aa1c66848f5ab1bc33d13153))

# [4.0.0-beta.11](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.10...v4.0.0-beta.11) (2020-09-20)

### Bug Fixes

- use post flush in modal example ([2024281](https://github.com/vuejs/vue-router-next/commit/2024281902d62454d9159c87d4288d691cd0bce8))
- **guards:** use post watcher for instances ([3234c59](https://github.com/vuejs/vue-router-next/commit/3234c5924f39fd9497866bfd160407256dc91bfe))

# [4.0.0-beta.10](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.9...v4.0.0-beta.10) (2020-09-18)

### Bug Fixes

- **history:** gracefully handle empty state ([cbcf2a9](https://github.com/vuejs/vue-router-next/commit/cbcf2a95a2af001c8aea96f3c76c4c4ef139219f)), closes [#366](https://github.com/vuejs/vue-router-next/issues/366)
- **types:** better type for navigate ([0384cb0](https://github.com/vuejs/vue-router-next/commit/0384cb062d50f6be37512410b4c2d170896dc9cb))
- **types:** explicit types on navigate ([36d218c](https://github.com/vuejs/vue-router-next/commit/36d218c15268d0d3d15d4ed3adc75c8cb09ed68b))
- **types:** fix types for redirect records ([a77f148](https://github.com/vuejs/vue-router-next/commit/a77f1485323ef3b654077ecb227fd5a0373d3a2f))
- **warn:** correctly warn against unused next ([47cd7b9](https://github.com/vuejs/vue-router-next/commit/47cd7b97bb7a3999178a26a4ca1af955178ea5d6))

### Code Refactoring

- **types:** Rename ScrollBehavior to RouterScrollBehavior ([9fc0996](https://github.com/vuejs/vue-router-next/commit/9fc09969db854bc0201454fbecd546637b76213a))

### Features

- **router:** remove partial Promise from router.go ([6ed6eee](https://github.com/vuejs/vue-router-next/commit/6ed6eee38b59eb0b6dec0bcb7d73e24203e20ba4))
- **types:** allow extending meta fields ([#407](https://github.com/vuejs/vue-router-next/issues/407)) ([706e84f](https://github.com/vuejs/vue-router-next/commit/706e84f0099a2a04485dfa98449fdc875442bb49))
- **warn:** point to scrollBehavior in message ([70ce7fe](https://github.com/vuejs/vue-router-next/commit/70ce7feefac3fddd2a9641fcc2ccc66b4b108775))

### BREAKING CHANGES

- **router:** The `router.go()` methods doesn't return anything
  (like in Vue Router 3) anymore. The existing implementation was wrong as it
  would resolve the promise for the following navigation if `router.go()`
  was called with something that wasn't possible e.g. `router.go(-20)`
  right after entering the application would not do anything. Even worse,
  the promise returned by that call would resolve **after the next
  navigation**. There is no proper native API to implement this
  promise-based api properly, but one can write a version that should work
  in most scenarios by setting up multiple hooks right before calling
  `router.go()`:

```js
export function go(delta) {
  return new Promise((resolve, reject) => {
    function popStateListener() {
      clearTimeout(timeout)
    }
    window.addEventListener('popstate', popStateListener)

    function clearHooks() {
      removeAfterEach()
      removeOnError()
      window.removeEventListener('popstate', popStateListener)
    }

    // if the popstate event is not called, consider this a failure
    const timeout = setTimeout(() => {
      clearHooks()
      reject(new Error('Failed to use router.go()'))
      // It's unclear of what value would always work here
    }, 10)

    setImmediate

    const removeAfterEach = router.afterEach((_to, _from, failure) => {
      clearHooks()
      resolve(failure)
    })
    const removeOnError = router.onError(err => {
      clearHooks()
      reject(err)
    })

    router.go(delta)
  })
}
```

- **types:** there is already an existing type named `ScrollBehavior`,
  so we are renaming our type to avoid any confusions and allow the user
  to use both types at the same type (which given what the existing
  `ScrollBehavior` type is designed for, will likely happen).

# [4.0.0-beta.9](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.8...v4.0.0-beta.9) (2020-09-01)

Build related fixes

# [4.0.0-beta.8](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.7...v4.0.0-beta.8) (2020-09-01)

### Bug Fixes

- **router-view:** reuse saved instances in different records ([#446](https://github.com/vuejs/vue-router-next/issues/446)) ([6554171](https://github.com/vuejs/vue-router-next/commit/65541718b0d5af665fd87dc0e48770cba832a2bb))
- **types:** add HTML attributes for JSX ([06f3f8f](https://github.com/vuejs/vue-router-next/commit/06f3f8fd7c3a32da331802fe5d3d19ced17200a3)), closes [#435](https://github.com/vuejs/vue-router-next/issues/435)
- **types:** allow components defined via defineComponent ([#421](https://github.com/vuejs/vue-router-next/issues/421)) ([e47c84c](https://github.com/vuejs/vue-router-next/commit/e47c84c74a97ae7bb9095ea75f98a6fa8a216532))

### BREAKING CHANGES

- **router-view:** `onBeforeRouteLeave` and `onBeforeRouteUpdate` used to
  have access to the component instance through `instance.proxy` but given
  that:
  1. It has been marked as `internal` (https://github.com/vuejs/vue-next/pull/1849)
  2. When using `setup`, all variables are accessible on the scope (and
     should be accessed that way because the code minimizes better)
     It has been removed to prevent wrong usage and lighten Vue Router

# [4.0.0-beta.7](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.6...v4.0.0-beta.7) (2020-08-19)

### Bug Fixes

- **encoding:** encode partial params ([eb04117](https://github.com/vuejs/vue-router-next/commit/eb041175c02ab0dac093823574a85bbbbf2056eb))
- **matcher:** avoid trailing slash with optional params ([faf0aab](https://github.com/vuejs/vue-router-next/commit/faf0aab6451848e5b4330e1d01033137a0c42a5a))
- **types:** append declare module ([50ad404](https://github.com/vuejs/vue-router-next/commit/50ad404ae45086f051b01ac552e4a3ab98535633)), closes [#419](https://github.com/vuejs/vue-router-next/issues/419)
- **vetur:** update tags/attributes definition ([#408](https://github.com/vuejs/vue-router-next/issues/408)) ([df8b2b1](https://github.com/vuejs/vue-router-next/commit/df8b2b140155d1e4ad5d00cd17d57ab2046a75e2))

### Features

- **warn:** warn against infinite redirections ([e3dcc8d](https://github.com/vuejs/vue-router-next/commit/e3dcc8d9477e17f9b92e22787b750edc4658b77a))

# [4.0.0-beta.6](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.5...v4.0.0-beta.6) (2020-08-05)

### Bug Fixes

- **router:** stack overflow with redirect ([3594011](https://github.com/vuejs/vue-router-next/commit/359401107078348f0410abbd36cffb3b8d4d8f85)), closes [#404](https://github.com/vuejs/vue-router-next/issues/404)

### Features

- **router-link:** add ariaCurrentValue prop ([23e6e9c](https://github.com/vuejs/vue-router-next/commit/23e6e9c10b4f9cb9f074ebb4f56d2d99acac9097))
- add Vetur support ([1f1189f](https://github.com/vuejs/vue-router-next/commit/1f1189fd23dc6ec318edd5d7e8f225b467d4d386)), closes [#381](https://github.com/vuejs/vue-router-next/issues/381)

# [4.0.0-beta.5](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.4...v4.0.0-beta.5) (2020-08-03)

### Features

- resolve simple relative links ([af1deaa](https://github.com/vuejs/vue-router-next/commit/af1deaab5e0fd1597a7cf7ee9a6d01cac507970d))
- **url:** simple resolve relative location ([69c44db](https://github.com/vuejs/vue-router-next/commit/69c44db3fd5363a833675b4b0ef14f97ac691af6))
- **warn:** warn if guard returns without calling next ([6e16bdd](https://github.com/vuejs/vue-router-next/commit/6e16bdd6338ea3b7da1f8a0b3000ec880be840d6))

# [4.0.0-beta.4](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.3...v4.0.0-beta.4) (2020-07-25)

### Bug Fixes

- **router-view:** render the slot when there is no match ([bae42d4](https://github.com/vuejs/vue-router-next/commit/bae42d41c2240947e5b649e568cad274214c6346)), closes [#385](https://github.com/vuejs/vue-router-next/issues/385)
- work on Edge by adding an argument to catch ([#383](https://github.com/vuejs/vue-router-next/issues/383)) ([9580bea](https://github.com/vuejs/vue-router-next/commit/9580bead1f03f1be95473e965daa1f1ee78921f3))

# [4.0.0-beta.3](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.2...v4.0.0-beta.3) (2020-07-21)

### Bug Fixes

- **guards:** call beforeRouteEnter once per named view ([f2846ff](https://github.com/vuejs/vue-router-next/commit/f2846ff2a0796e58a9b04593909f7a30b7b68bb1))
- **guards:** remove registered update guards after leaving ([41bffda](https://github.com/vuejs/vue-router-next/commit/41bffda49c24d560cfe555aa88bcebbbd1d03d68))
- **guards:** skip update and leave guards of unmounted views ([f22e70a](https://github.com/vuejs/vue-router-next/commit/f22e70a6d15ce9834c9eb841d9fe9547c5d21e24))
- **hash:** allow url to contain search params before hash ([ae8b289](https://github.com/vuejs/vue-router-next/commit/ae8b28934b1c9a092174ebd6fb5aa10aefe1de44)), closes [#378](https://github.com/vuejs/vue-router-next/issues/378)

### Features

- **errors:** export isNavigationFailure ([28a9b25](https://github.com/vuejs/vue-router-next/commit/28a9b25d976c325d3193cada8034a6e42297e665))
- **guards:** allow guards to return a value instead of calling next ([#343](https://github.com/vuejs/vue-router-next/issues/343)) ([5cb209f](https://github.com/vuejs/vue-router-next/commit/5cb209f3bb53ac0ddf62152f695da610facf4724))
- **guards:** wip context support in multi apps ([34d7390](https://github.com/vuejs/vue-router-next/commit/34d7390b946644a128ab6fd03fd821a91fd4782c))

# [4.0.0-beta.2](https://github.com/vuejs/vue-router-next/compare/v4.0.0-beta.1...v4.0.0-beta.2) (2020-07-07)

Fix build cache issues

# [4.0.0-beta.1](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.14...v4.0.0-beta.1) (2020-07-03)

### Bug Fixes

- **hash:** manual changes should trigger a navigation ([93891ab](https://github.com/vuejs/vue-router-next/commit/93891abf02fc24d66c6f43926a28f275560fb714)), closes [#346](https://github.com/vuejs/vue-router-next/issues/346)
- **router-link:** add missing prop custom in jsx ([c6274ae](https://github.com/vuejs/vue-router-next/commit/c6274aeaf5ad4ba4f97c82aad3e1819ef20f5d69))
- **router-view:** preserve keep-alive route guard this context ([#344](https://github.com/vuejs/vue-router-next/issues/344)) ([994c073](https://github.com/vuejs/vue-router-next/commit/994c073fd90add30bf16b5268332277f8b082a74))
- **warn:** warn when RouterView is wrapped with transition ([e4b3fbe](https://github.com/vuejs/vue-router-next/commit/e4b3fbe8b799b6621537afe365267a18eab9d3cd))

### Code Refactoring

- **history:** simplify location as a string ([10a071c](https://github.com/vuejs/vue-router-next/commit/10a071c85c62b6674929162aa36220bd8c167f27))
- **router:** remove history property ([aba3a3f](https://github.com/vuejs/vue-router-next/commit/aba3a3f3a0d860f76d75938ae09616a329c7c13c))

### Features

- **guards:** next callback beforeRouteEnter ([d9dad0b](https://github.com/vuejs/vue-router-next/commit/d9dad0b9467fee9478406899043ee35f30cdf1fb))

### BREAKING CHANGES

- **router:** the history property was marked as internal already. Since we
  need to pass the history instance to the router, we always have access to it,
  differently from Vue Router 3 where the history was instantiated internally.
  The history API was also internal (it wasn't documented), so this change
  shouldn't be a problem as people shouldn't be relying on `router.history` in
  their apps. If you think this property is needed, please open an issue to
  discuss the use case. Note it's already accessible as you have to create it:

```js
export const history = createWebHistory()
export const router = createRouter({ history, routes: [] })
```

- **history:** HistoryLocation is just a string now. It was pretty much an
  internal property but it could be used inside `history.state`. It used to be an
  object `{ fullPath: '/the-url' }`. And it's now just the `fullPath` property.

# [4.0.0-alpha.14](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.13...v4.0.0-alpha.14) (2020-07-01)

### Bug Fixes

- **hash:** use relative links in hash mode ([32c9590](https://github.com/vuejs/vue-router-next/commit/32c9590db89e69c8f7c61905a5eaf19df2054e42)), closes [#342](https://github.com/vuejs/vue-router-next/issues/342)
- **query:** do not normalize query with custom stringifyQuery ([ea65066](https://github.com/vuejs/vue-router-next/commit/ea65066e8511d8320ad8de37b32ea9a8028fa9d5)), closes [#328](https://github.com/vuejs/vue-router-next/issues/328)
- **query:** isSameRouteLocation compares queries by string ([6e1f0ea](https://github.com/vuejs/vue-router-next/commit/6e1f0eacf60c7e3d465dd0af68f79dc649269b17)), closes [#328](https://github.com/vuejs/vue-router-next/issues/328)

### Features

- **redirect:** allow redirect on routes witch children ([e57b875](https://github.com/vuejs/vue-router-next/commit/e57b875dd9d375778a847627434803f4ec79a818))
- **router:** support multiple apps at the same time ([565ec9d](https://github.com/vuejs/vue-router-next/commit/565ec9d489b4aad347ee466b781ca85aff76bf2d))

# [4.0.0-alpha.13](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.12...v4.0.0-alpha.13) (2020-06-18)

### Bug Fixes

- allow arbitrary selectors starting with # ([14b859d](https://github.com/vuejs/vue-router-next/commit/14b859dfa6fa5ccefe42c6f834ddd24dd9921a1b))
- use assign to align with Vue browser support ([#311](https://github.com/vuejs/vue-router-next/issues/311)) ([f80b670](https://github.com/vuejs/vue-router-next/commit/f80b670d4dac30323221fcb2f93137ffd874c51b)), closes [#304](https://github.com/vuejs/vue-router-next/issues/304)
- **hash:** use location.pathname ([0078147](https://github.com/vuejs/vue-router-next/commit/007814745dd98bb8cfa53f44d5c308193b2fbb60)), closes [#261](https://github.com/vuejs/vue-router-next/issues/261)
- **matcher:** correct check when removing existing records on add ([2c267f5](https://github.com/vuejs/vue-router-next/commit/2c267f5aceec899c84514571e4fa75dc61441ed4))
- **matcher:** override records by name when adding ([07100fc](https://github.com/vuejs/vue-router-next/commit/07100fc1386fb636da3eb1c8196a36f6538eb91f))
- **scroll:** avoid reusing scroll position ([dfc1fb3](https://github.com/vuejs/vue-router-next/commit/dfc1fb34a761138a3390ccd5a8a042863018222a))

### Features

- **scroll:** allow passing behavior option ([12e9209](https://github.com/vuejs/vue-router-next/commit/12e92094df46129ddf75d0fa8e3d9816644200de))
- **scroll:** replace selector with el ([ab8a01c](https://github.com/vuejs/vue-router-next/commit/ab8a01c0a6eda1bafc293b39cb6c77ed10fb359e))
- **warn:** warn if component is a promise ([4b2bfa8](https://github.com/vuejs/vue-router-next/commit/4b2bfa80cd3440441d71e690ca85d0532a4b8428))
- **warn:** warn when routes are not found ([#279](https://github.com/vuejs/vue-router-next/issues/279)) ([d125356](https://github.com/vuejs/vue-router-next/commit/d125356e0f67f906f5f602f0b485f9e1e4f5bf51))
- allow props for named views ([dbe2344](https://github.com/vuejs/vue-router-next/commit/dbe2344af5fed39aa4aa8fbfe48b195580d9538b))
- **warn:** warn multiple params with same name ([5c8cd6e](https://github.com/vuejs/vue-router-next/commit/5c8cd6e8ae1223e9871252cc617b19424f01c5c2))

### BREAKING CHANGES

- **scroll:** this change follows the RFC at
  https://github.com/vuejs/rfcs/pull/176:

* `selector` is renamed into `el`
* `el` also accepts an `Element`
* `left` and `top` are passed along `el` instead of inside an object
  passed as `offset`

- **scroll:** `scrollBehavior` doesn't accept an object with `x` and `y`
  coordinates anymore. Instead it accepts an object like
  [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions)
  with `left` and `top` properties. You can now also pass the
  [`behavior`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior)
  property to enable smooth scrolling in most browsers.
- It is now necessary to escape id selectors like
  explained at https://mathiasbynens.be/notes/css-escapes. This was
  necessary to allow selectors like `#container > child`.

# [4.0.0-alpha.12](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.11...v4.0.0-alpha.12) (2020-05-19)

### Bug Fixes

- **hash:** allow base with non trailing slash ([f5cc050](https://github.com/vuejs/vue-router-next/commit/f5cc0505f9e0cc30ff94e362ceb24d300afd684d)), closes [#247](https://github.com/vuejs/vue-router-next/issues/247)
- prevent error on initial navigation to //invalid ([e72e4ba](https://github.com/vuejs/vue-router-next/commit/e72e4ba1cc7b80aa44d3958db259d9e3a351d0fd))

### Features

- **warn:** warn multiple leading slashes ([87c5e53](https://github.com/vuejs/vue-router-next/commit/87c5e53b43c218c83f9db986ac7538d74525ea5b))

### BREAKING CHANGES

- **hash:** When providing a base for hash histories, it is now necessary
  to include a trailing slash to create a url that starts with `/#/`, otherwise it
  will result in a url starting with `#/`. This allows users to use the routing
  system directly in simple files without needing to configure a server at all:
  - `https://example.com/file.html` + `base: 'file.html` will produce a final
    url of `https://example.com/file.html#/`
  - `https://example.com/folder` + `base: 'folder` will produce a final url of
    `https://example.com/folder#/`
  - `https://example.com/folder` + `base: 'folder/` will produce a final url of
    `https://example.com/folder/#/`

# [4.0.0-alpha.11](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.10...v4.0.0-alpha.11) (2020-05-12)

### Bug Fixes

- **scroll:** change scrollRestoration if scrollBehavior is provided ([5cf2e61](https://github.com/vuejs/vue-router-next/commit/5cf2e611de2477e92699121573cb162ff98a7b8d))
- match base in a non-sensitive way ([7087bbc](https://github.com/vuejs/vue-router-next/commit/7087bbc9c479f2955381d8a823a3ef8f9eed7b5a))
- **router:** allow multiple router instance ([24d3d49](https://github.com/vuejs/vue-router-next/commit/24d3d49babcdea751f4c4e7e9a87625f8744a122))
- **router:** unique first navigation with multi app ([33172af](https://github.com/vuejs/vue-router-next/commit/33172aff03b7c302699753a8abe5750094bdde26))

### Features

- **types:** export NavigationGuardNext ([#229](https://github.com/vuejs/vue-router-next/issues/229)) ([888bf4d](https://github.com/vuejs/vue-router-next/commit/888bf4df33d718d74e5835e99d0f1ac4ce3a0ccf))
- explicit injection symbols in dev mode ([#228](https://github.com/vuejs/vue-router-next/issues/228)) ([fab88ee](https://github.com/vuejs/vue-router-next/commit/fab88ee261c49b739545918deab583757aab561e))
- support jsx and tsx for RouterLink and RouterView ([1d3dce3](https://github.com/vuejs/vue-router-next/commit/1d3dce3106af700fc95a403f1c229644fe8d85b8)), closes [#226](https://github.com/vuejs/vue-router-next/issues/226)
- **router:** allow functional components for routes ([096d864](https://github.com/vuejs/vue-router-next/commit/096d86498e954345c6bd4d8e82fe54c37d3f869b))
- **scroll:** scroll to the same location like regular links ([5f22d4f](https://github.com/vuejs/vue-router-next/commit/5f22d4fa39171906802cc20ada00ec57bdfce880))
- **warn:** warn if next was called multiple times ([dce2612](https://github.com/vuejs/vue-router-next/commit/dce2612e495b1d5789cd993a54d24599967a8cf4))

# [4.0.0-alpha.10](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.9...v4.0.0-alpha.10) (2020-05-05)

### Bug Fixes

- **scroll:** do not restore on push ([3f79195](https://github.com/vuejs/vue-router-next/commit/3f7919585117048c379b6dee8af1cc1de5996af0))

### Features

- **warn:** warn invalid hash ([fcf2365](https://github.com/vuejs/vue-router-next/commit/fcf2365556dffa87153c13d31a684070f123ea0e))
- allow numbers as params ([ef0920a](https://github.com/vuejs/vue-router-next/commit/ef0920a86574bca10836214015c2317ed11a29b7)), closes [#206](https://github.com/vuejs/vue-router-next/issues/206)
- **router:** allow global router classes ([388735b](https://github.com/vuejs/vue-router-next/commit/388735bc752852e2a9a24f971207fd81fae45fcf))
- **router:** go, back and forward can be awaited ([eb87757](https://github.com/vuejs/vue-router-next/commit/eb87757ed189958c8c9955a10ece9306fa99f6d8))
- **warn:** detect missing param in nested absolute paths ([f5b5949](https://github.com/vuejs/vue-router-next/commit/f5b59493a4e27bf07bd5a0d2e109bc6750f6f1a9))
- **warn:** warn for invalid path+params and redirect ([91f4de9](https://github.com/vuejs/vue-router-next/commit/91f4de9aab99231fb39ed4cc5b4052979afda216))
- **warn:** warn missing params in alias ([186e275](https://github.com/vuejs/vue-router-next/commit/186e2755ec0488ff80bdde11a53b0ddc9ee9fc03))
- **warn:** warn when params are provided alongside path ([8a8ddf1](https://github.com/vuejs/vue-router-next/commit/8a8ddf1a5e5f2d29733da4fe25e4ddb447b0df30))

# [4.0.0-alpha.9](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.8...v4.0.0-alpha.9) (2020-04-29)

- Removed sourcemaps from build

# [4.0.0-alpha.8](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.7...v4.0.0-alpha.8) (2020-04-29)

### Bug Fixes

- default matcher options ([cea397b](https://github.com/vuejs/vue-router-next/commit/cea397b7402cd27ff06013f846bf35966aff6952))
- **guards:** preserve navigation options when redirecting ([9effd81](https://github.com/vuejs/vue-router-next/commit/9effd816c51b58cb1103d878799aed6992f78454))
- **html5:** correctly preserve current history.state ([0586394](https://github.com/vuejs/vue-router-next/commit/05863948ee86e0f1c9c9ec31c02ad7af17923743)), closes [#180](https://github.com/vuejs/vue-router-next/issues/180)
- **link:** make alias of empty child active ([cfe5993](https://github.com/vuejs/vue-router-next/commit/cfe5993332cc7dc94c5de2f2edb7f2e15c9b7049))
- encode hash ([85bb7e1](https://github.com/vuejs/vue-router-next/commit/85bb7e11b1a4326f5048a823ae7d49654b308cdd))
- **link:** preserve the alias path ([fffa585](https://github.com/vuejs/vue-router-next/commit/fffa58585ac89e9fb6b648e61e499a9ee3a9e217))
- **matcher:** merge params ([d8a6b25](https://github.com/vuejs/vue-router-next/commit/d8a6b2591ac2e37388fb7f4ce8c70922389cedb5)), closes [#189](https://github.com/vuejs/vue-router-next/issues/189)
- **router:** make redirect relative to target location ([e878e91](https://github.com/vuejs/vue-router-next/commit/e878e91af217fde6d2e934857ce895e7abbd5920))
- **router:** preserve navigation options with redirects ([9732758](https://github.com/vuejs/vue-router-next/commit/9732758d076eef252f2940ffa44e44fa94e794a0))
- **view:** render slot with no match ([5873296](https://github.com/vuejs/vue-router-next/commit/5873296ec96df15f13b0cf02b685ebb36f4e0a41))

### Code Refactoring

- Link and View renamed to RouterLink and RouterView ([030bbc4](https://github.com/vuejs/vue-router-next/commit/030bbc4c3f68d29a9e9d23ee01603394427427a3))

### Features

- **link:** make empty child active with adjacent children ([4b813b1](https://github.com/vuejs/vue-router-next/commit/4b813b1ec387f8be9506f1400b7e83fd5794c7af))
- **router:** add global pathOptions ([7383564](https://github.com/vuejs/vue-router-next/commit/73835649f450ffc378b906c72aa5ae8a6a03feb2))
- add navigation duplicated failure ([9570416](https://github.com/vuejs/vue-router-next/commit/9570416c75f904a172af07bcf10956fe3385ec13))
- add onBeforeRouteUpdate ([96c9503](https://github.com/vuejs/vue-router-next/commit/96c95035653a52f94781808fccbf262a02a3cd79))
- resolve relative paths ([eae833e](https://github.com/vuejs/vue-router-next/commit/eae833e0fc1c8e549f2b4cd47b3dcb90484d17d5))
- **router:** add back,forward,go ([5e927b5](https://github.com/vuejs/vue-router-next/commit/5e927b5ab8a09c2941edbec7c6af145323c6d3eb))
- **router:** add beforeResolve ([9697134](https://github.com/vuejs/vue-router-next/commit/9697134c05f0f4c6fde48a773880946074e95666))
- **scroll:** handle scroll on reload ([617f131](https://github.com/vuejs/vue-router-next/commit/617f131d2473952072f345000c3d43556dfe9761))

### Performance Improvements

- use index access for strings ([971fea4](https://github.com/vuejs/vue-router-next/commit/971fea415fcce84ce86d8ace67b65115af3b7ac2))

### BREAKING CHANGES

- exported components Link and View have been renamed to be
  include the _Router_ prefix and to have the same export name as their component
  name

# [4.0.0-alpha.7](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2020-04-17)

### Features

- add `$route` and `$router` types ([a4f80aa](https://github.com/vuejs/vue-router-next/commit/a4f80aaaafb1bf29a3f4d992e8c6a2bec0f70d62))
- add guards types ([c7ccd5a](https://github.com/vuejs/vue-router-next/commit/c7ccd5a0e67d88467fc661474308fbdf55b947ec))
- refactor navigation to comply with vuejs/rfcs[#150](https://github.com/vuejs/vue-router-next/issues/150) ([290c3be](https://github.com/vuejs/vue-router-next/commit/290c3be1f6cb476016f23b77d6fc49987dd84751))

### BREAKING CHANGES

- This follows the RFC at https://github.com/vuejs/rfcs/pull/150
  Summary: `router.afterEach` and `router.onError` are now the global equivalent of
  `router.push`/`router.replace` as well as navigation through the interface
  (`history.go()`). A navigation only rejects if there was an unexpected error.
  A navigation failure will still resolve the promise returned by `router.push`
  and be exposed as the resolved value.

# [4.0.0-alpha.6](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2020-04-17)

### Bug Fixes

- **history:** allow base with / and base tag ([d7c71b5](https://github.com/vuejs/vue-router-next/commit/d7c71b55ee4a11ecaf3a72f25eb126d118829d3f)), closes [#164](https://github.com/vuejs/vue-router-next/issues/164)
- **history:** allow hash history with no origin ([760d216](https://github.com/vuejs/vue-router-next/commit/760d21672051b6338d40f2cdfdac80dc16209e13)), closes [#163](https://github.com/vuejs/vue-router-next/issues/163)
- **scroll:** only apply on browser ([cf53192](https://github.com/vuejs/vue-router-next/commit/cf53192b77d619b1e43c8decda76d4083d9c17ea))
- revert history navigation if navigation is cancelled ([d8a0d11](https://github.com/vuejs/vue-router-next/commit/d8a0d117dbede9b177f06c8ebab201d12dfca0c0))

### Code Refactoring

- **router:** merge createHref into resolve ([66b2db9](https://github.com/vuejs/vue-router-next/commit/66b2db95b6b73433dc3abbe6c6f7f07959429d78))

### Features

- add this.\$route ([92dc18d](https://github.com/vuejs/vue-router-next/commit/92dc18d448ffeb57d9b3f3b303b8ec2991175eb5))
- add this.\$router ([1807f30](https://github.com/vuejs/vue-router-next/commit/1807f301053ac93db1e50991f67dcf532990d5c9))
- **scroll:** handle scroll on popstate ([181efe9](https://github.com/vuejs/vue-router-next/commit/181efe9f29a200b03e2d8f4759e7854047936824))
- merge meta fields ([72a052f](https://github.com/vuejs/vue-router-next/commit/72a052fdf4a198e3ac72779f1b7b8b80d0ac018d))
- **guards:** support errors in navigation guards ([23ed08d](https://github.com/vuejs/vue-router-next/commit/23ed08d983f308b7b118f2a235e58d29bf1994ec))
- **router:** hasRoute ([ca02444](https://github.com/vuejs/vue-router-next/commit/ca02444c91c8f6b21caf6a71dee5d0f2e3f7e51b))

### Reverts

- Revert "test: only call browser.end on the last test" ([d3221f1](https://github.com/vuejs/vue-router-next/commit/d3221f16978186b09531f7ea0cb5b92b20147181))

### BREAKING CHANGES

- **router:** createHref is removed from the router. Instead, resolve
  returns a location object with the corresponding `href` property

# [4.0.0-alpha.5](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2020-04-08)

### Bug Fixes

- **link:** not active when matched is empty ([acd644d](https://github.com/vuejs/vue-router-next/commit/acd644db70793da7719b321b2dcdd537ec358f9c))
- check query and hash when navigating ([3862ad9](https://github.com/vuejs/vue-router-next/commit/3862ad924bbc734a835577c3a3c71bc3550db29c))
- ignore order of keys in query and params ([643bd15](https://github.com/vuejs/vue-router-next/commit/643bd15ceaf9d6314434b15b169171b599b58e1c))
- skip initial guards with static redirect ([c76bb93](https://github.com/vuejs/vue-router-next/commit/c76bb938a2c9a1790be98b6ce44ccd153a342141))
- **types:** add missing exported types ([ec241f7](https://github.com/vuejs/vue-router-next/commit/ec241f7a93107815d9ffd25d36cbf00b47cb7318)), closes [#147](https://github.com/vuejs/vue-router-next/issues/147)

### Features

- allow symbols as route record name ([f42ab3f](https://github.com/vuejs/vue-router-next/commit/f42ab3fecfaecddcef0ccf8bb0f7f44ca24d6160))
- **link:** activeClass and exactActiveClass props ([d53b383](https://github.com/vuejs/vue-router-next/commit/d53b3832b50131cb83b8c567015780e60addb6c8))
- **link:** allow `custom` prop ([874510b](https://github.com/vuejs/vue-router-next/commit/874510be69c3b068970e8a90ae251cf487d6acf9))

### BREAKING CHANGES

- Renamed types by removing suffix Normalized and using Raw instead
  - `RouteLocation` -> `RouteLocationRaw`
  - `RouteLocationNormalized` -> `RouteLocation`
  - `RouteLocationNormalized` is now a location that can be displayed (not a static redirect)
  - `RouteLocationNormalizedResolved` -> `RouteLocationNormalizedLoaded`
  - `RouteRecord` -> `RouteRecordRaw`
  - `RouteRecordNormalized` -> `RouteRecord`
  - `RouteRecordNormalized` is now a record that is not a static redirect

# [4.0.0-alpha.4](https://github.com/vuejs/vue-router-next/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2020-03-28)

### Bug Fixes

- **history:** use current history state when replacing ([5d80209](https://github.com/vuejs/vue-router-next/commit/5d802094923851102557bfb2583835cc135e16b8))
- export more types ([1583d48](https://github.com/vuejs/vue-router-next/commit/1583d480fff2da1caa35c2dd7892c36b57dad734)), closes [#137](https://github.com/vuejs/vue-router-next/issues/137)
- **guards:** free instances only if navigation is confirmed ([d0514e1](https://github.com/vuejs/vue-router-next/commit/d0514e192839c54c4181f80286602e9d37459f4d))
- **hash:** fix base position for hash routing ([ba40b8f](https://github.com/vuejs/vue-router-next/commit/ba40b8f0cf2d6d85533e0e7e7daaadd088298f19))
- initial location with base ([d05208b](https://github.com/vuejs/vue-router-next/commit/d05208b6c9457931bda8205ba6d9f1d5e39a54c7))
- **router:** prevent duplicated navigation on aliases ([e825586](https://github.com/vuejs/vue-router-next/commit/e82558684c0b6b688065032df65604b2c245d395))

### Features

- allow passing state to history ([ac1c96f](https://github.com/vuejs/vue-router-next/commit/ac1c96f176dcad8aac03a86a1dccfbaab4b66520))
- improve route access ([baf266c](https://github.com/vuejs/vue-router-next/commit/baf266cd1bd6cafd32d244f185e340bee10af32c))
- **history:** expose state on html5 ([3f83607](https://github.com/vuejs/vue-router-next/commit/3f83607c8798960f49cdb5eed8fdfe8adc52fabf))
- **matcher:** remove aliases alongside the original record ([26b71b2](https://github.com/vuejs/vue-router-next/commit/26b71b285b743ab8af94b9297fa7037872ae0de6))
- **router:** support custom parseQuery and stringifyQuery ([#136](https://github.com/vuejs/vue-router-next/issues/136)) ([5dce7bc](https://github.com/vuejs/vue-router-next/commit/5dce7bcbfbb4a80bd1edbe061a250fa646f2afd7))
- **view:** add props option as boolean ([7fe1e7d](https://github.com/vuejs/vue-router-next/commit/7fe1e7dc7406bddd0924bf7f01709b9113582472))
- **view:** allow passing props as a function ([494fc5e](https://github.com/vuejs/vue-router-next/commit/494fc5efb6add93c68ed467bb9a8dc7b3b149fff))
- **view:** useView to customize router-view ([06b0c34](https://github.com/vuejs/vue-router-next/commit/06b0c34ee5018aa9d76c0bfcd32ff2c12cd94277))
- allow true in `next` ([d76c6aa](https://github.com/vuejs/vue-router-next/commit/d76c6aae115110e2d9c4c072748bd9403080c8bd))
- invoke guards with the right context ([7053413](https://github.com/vuejs/vue-router-next/commit/7053413c93bc715d5c2179378367dc12f60a118d))
- lazy loading ([6ecdc70](https://github.com/vuejs/vue-router-next/commit/6ecdc70baa6361b8614368196ff2652560b6a0ba))
- **view:** allow props as object in record ([fd4dc06](https://github.com/vuejs/vue-router-next/commit/fd4dc0630bdf856f972ed6e9020b70a70ac582b4))

### BREAKING CHANGES

- `useRoute` now retrieves a reactive RouteLocationNormalized instead of a Ref<RouteLocationNormalized>.
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
