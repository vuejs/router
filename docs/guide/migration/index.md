# Migrating from Vue 2

Most of Vue Router API has remained unchanged during its rewrite from v3 (for Vue 2) to v4 (for Vue 3) but there are still a few breaking changes that you might encounter while migrating your application. This guide is here to help you understand why these changes happened and how to adapt your application to make it work with Vue Router 4.

## New Features

Some of new features to keep an eye on in Vue Router 4 include:

<!-- TODO: links -->

- Dynamic Routing
- [Composition API](/guide/advanced/composition-api.md)
- Custom History implementation

## Breaking Changes: Improvements

The following changes should not be a problem for you but they are technically breaking changes that will show a different behavior and might break parts of your application.

### Non existent named routes

Pushing or resolving a non existent named route throws an error:

```js
// Oops, we made a typo in name
router.push({ name: 'homee' }) // throws
router.resolve({ name: 'homee' }) // throws
```

**Reason**: Previously, the router would navigate to `/` but display nothing (instead of the home page). Throwing an error makes more sense because we cannot produce a valid URL to navigate to.

### Missing required `params` on named routes

Pushing or resolving a named route without its required params will throw an error:

```js
// given the following route:
const routes = [{ path: '/users/:id', name: 'users' }]

// Missing the `id` param will fail
router.push({ name: 'users' })
router.resolve({ name: 'users' })
```

**Reason**: Same as above.

### Named children routes with an empty `path` no longer appends a slash

Given any nested named route with an empty `path`:

```js
const routes = [
  {
    path: '/dashboard',
    name: 'dashboard-parent',
    children: [
      { path: '', name: 'dashboard' },
      { path: 'settings', name: 'dashboard-settings' },
    ],
  },
]
```

Navigating or resolving to the named route `dashboard` will now produce a URL **without a trailing slash**:

```js
router.resolve({ name: 'dashboard' }).href // '/dashboard'
```

This has an important side effect about children `redirect` records like these:

```js
const routes = [
  {
    path: '/parent',
    children: [
      // this would now redirect to `/home` instead of `/parent/home`
      { path: '', redirect: 'home' },
      { path: 'home' },
    ],
  },
]
```

Note this will work if `path` was `/parent/` as the relative location `home` to `/parent/` is indeed `/parent/home` but the relative location of `home` to `/parent` is `/home`. Learn more about relative links [in the cookbook](/cookbook/relative-links.md).

**Reason**: This is to make trailing slash behavior consistent: by default all routes allow a trailing slash. [It can be disabled](/cookbook/trailing-slashes.md).

### `$route` properties Encoding

Decoded values are now consistent no matter where the navigation is initiated (older browsers will still produce unencoded `path` and `fullPath`). The initial navigation should yield the same results as in-app navigations.

Given any [normalized route location](#TODO):

- Values in `path`, `fullPath` are not decoded anymore. They will appear as provided by the browser (modern browsers provide them encoded). e.g. directly writing on the address bar `https://example.com/hello world` will yield the encoded version: `https://example.com/hello%20world` and both `path` and `fullPath` will be `/hello%20world`.
- `hash` is now decoded, that way it can be copied over: `router.push({ hash: $route.hash })`.
- When using `push`, `resolve` and `replace` and providing a `string` location or a `path` property in an object, **it must be encoded**. On the other hand, `params`, `query` and `hash` must be provided in its unencoded version.

**Reason**: This allows to easily copy existing properties of a location when calling `router.push()` and `router.resolve()`. Learn more about encoding [in the cookbook](/cookbook/encoding.md).

## Breaking Changes: API Changes

The following changes will require you to adapt your code

### New `history` option to replace `mode`

The `mode: 'history'` option has been replaced with a more flexible one named `history`:

```js
import { createRouter, createWebHistory } from 'vue-router'
// there is also createWebHashHistory and createMemoryHistory

createRouter({
  history: createWebHistory(),
  routes: [],
})
```

On SSR, you need to manually pass the appropriate history:

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

**Reason**: enable tree shaking of non used histories as well as implementing custom histories for advanced use cases like native solutions.

### Moved the `base` option

The `base` option is now passed as the first argument to `createWebHistory` (and other histories):

```js
import { createRouter, createWebHistory } from 'vue-router'
createRouter({
  history: createWebHistory('/base-directory/'),
  routes: [],
})
```

### Removed `*` (star or catch all) routes

Catch all routes (`*`, `/*`) must now be defined using a parameter with a custom regex:

```js
const routes = [
  // pathMatch is the name of the param, e.g., going to /not/found yields
  // { params: { pathMatch: ['not', 'found'] }}
  { path: '/:pathMatch(.*)*', name: 'not-found' },
  // if you omit the last `*`, the `/` character in params will be encoded when resolving or pushing
  { path: '/:pathMatch(.*)', name: 'bad-not-found' },
]
// bad example:
router.resolve({
  name: 'bad-not-found',
  params: { pathMatch: 'not/found' },
}).href // '/not%2Ffound'
// good example:
router.resolve({
  name: 'not-found',
  params: { pathMatch: ['not', 'found'] },
}).href // '/not/found'
```

**Reason**: Vue Router doesn't use `path-to-regexp` anymore, instead it implements its own parsing system that allows route ranking and enables dynamic routing. Since we usually add one single catch-all route per project, there is no big benefit in supporting a special syntax for `*`.

### Removal of `router.match` and changes to `router.resolve`

Both `router.match`, and `router.resolve` have been merged together into `router.resolve` with a slightly different signature. [Refer to the API](#TODO) for more details.

**Reason**: Uniting multiple methods that were use for the same purpose.

### Removal of `router.getMatchedComponents()`

The method `router.getMatchedComponents` is now removed as matched components can be retrieved from `router.currentRoute.value.matched`:

```js
router.currentRoute.value.matched.flatMap(record =>
  Object.values(record.components)
)
```

**Reason**: This method was only used during SSR and is a one liner that can be done by the user.

### Removal of `append` prop in `<router-link>`

The `append` prop has been removed from `<router-link>`. You can manually concatenate the value to an existing `path` instead:

```html
replace
<router-link to="child-route" append>to relative child</router-link>
with
<router-link :to="append($route.path, 'child-route')">
  to relative child
</router-link>
```

You must define a global `append` function on your _App_ instance:

```js
app.config.globalProperties.append = (path, pathToAppend) =>
  path + (path.endsWith('/') ? '' : '/') + pathToAppend
```

**Reason**: `append` wasn't used very often, is easy to replicate in user land.

### Removal of `event` and `tag` props in `<router-link>`

Both `event`, and `tag` props have been removed from `<router-link>`. You can use the [`v-slot` API](#TODO) to fully customize `<router-link>`:

```html
replace
<router-link to="/about" tag="span" event="dblclick">About Us</router-link>
with
<router-link to="/about" custom v-slot="{ navigate }">
  <span @dblclick="navigate" role="link">About Us</span>
</router-link>
```

**Reason**: These props were often used together to use something different from an `<a>` tag but were introduced before the `v-slot` API and are not used enough to justify adding to the bundle size for everybody.

### Removal of the `exact` prop in `<router-link>`

The `exact` prop has been removed because the caveat it was fixing is no longer present. See the [RFC about active matching](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0028-router-active-link.md) changes for more details.

### **All** navigations are now always asynchronous

All navigations, including the first one, are now asynchronous, meaning that, if you use a `transition`, you may need to wait for the router to be _ready_ before mounting the app:

```js
app.use(router)
// Note: on Server Side, you need to manually push the initial location
router.isReady().then(() => app.mount('#app'))
```

Otherwise there will be an initial transition as if you provided the `appear` prop to `transition` because the router displays its initial location (nothing) and then displays the first location.

Note that **if you have navigation guards upon the initial navigation**, you might not want to block the app render until they are resolved unless you are doing Server Side Rendering.

### `scrollBehavior` changes

The object returned in `scrollBehavior` is now similar to [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions): `x` is renamed to `left` and `y` is renamed to `top`. See [RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0035-router-scroll-position.md).

**Reason**: making the object similar to `ScrollToOptions` to make it feel more familiar with native JS APIs and potentially enable future new options.

### `<router-view>`, `<keep-alive>`, and `<transition>`

`transition` and `keep-alive` must now be used **inside** of `RouterView` via the `v-slot` API:

```vue
<router-view v-slot="{ Component }">
  <transition>
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

**Reason**: This is was a necessary change. See the [related RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0034-router-view-keep-alive-transitions.md).

### Removal of `parent` from route locations

The `parent` property has been removed from normalized route locations (`this.$route` and object returned by `router.resolve`). You can still access it via the `matched` array:

```js
const parent = this.$route.matched[this.$route.matched.length - 2]
```

**Reason**: Having `parent` and `children` creates unnecessary circular references while the properties could be retrieved already through `matched`.

### Removal of `pathToRegexpOptions`

The `pathToRegexpOptions` and `caseSensitive` properties of route records have been replaced with `sensitive` and `strict` options for `createRouter()`. They can now also be directly passed when creating the router with `createRouter()`. Any other option specific to `path-to-regexp` has been removed as `path-to-regexp` is no longer used to parse paths.

### TypeScript

To make typings more consistent and expressive, some types have been renamed:

| `vue-router@3` | `vue-router@4`          |
| -------------- | ----------------------- |
| RouteConfig    | RouteRecordRaw          |
| Location       | RouteLocation           |
| Route          | RouteLocationNormalized |
