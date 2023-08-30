# Migrating from Vue 2

Most of Vue Router API has remained unchanged during its rewrite from v3 (for Vue 2) to v4 (for Vue 3) but there are still a few breaking changes that you might encounter while migrating your application. This guide is here to help you understand why these changes happened and how to adapt your application to make it work with Vue Router 4.

## Breaking Changes

Changes are ordered by their usage. It is therefore recommended to follow this list in order.

### new Router becomes createRouter

Vue Router is no longer a class but a set of functions. Instead of writing `new Router()`, you now have to call `createRouter`:

```js
// previously was
// import Router from 'vue-router'
import { createRouter } from 'vue-router'

const router = createRouter({
  // ...
})
```

### New `history` option to replace `mode`

The `mode: 'history'` option has been replaced with a more flexible one named `history`. Depending on which mode you were using, you will have to replace it with the appropriate function:

- `"history"`: `createWebHistory()`
- `"hash"`: `createWebHashHistory()`
- `"abstract"`: `createMemoryHistory()`

Here is a full snippet:

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

### Removal of the `fallback` option

The `fallback` option is no longer supported when creating the router:

```diff
-new VueRouter({
+createRouter({
-  fallback: false,
// other options...
})
```

**Reason**: All browsers supported by Vue support the [HTML5 History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API), allowing us to avoid hacks around modifying `location.hash` and directly use `history.pushState()`.

### Removed `*` (star or catch all) routes

Catch all routes (`*`, `/*`) must now be defined using a parameter with a custom regex:

```js
const routes = [
  // pathMatch is the name of the param, e.g., going to /not/found yields
  // { params: { pathMatch: ['not', 'found'] }}
  // this is thanks to the last *, meaning repeated params and it is necessary if you
  // plan on directly navigating to the not-found route using its name
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  // if you omit the last `*`, the `/` character in params will be encoded when resolving or pushing
  { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound },
]
// bad example if using named routes:
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

:::tip
You don't need to add the `*` for repeated params if you don't plan to directly push to the not found route using its name. If you call `router.push('/not/found/url')`, it will provide the right `pathMatch` param.
:::

**Reason**: Vue Router doesn't use `path-to-regexp` anymore, instead it implements its own parsing system that allows route ranking and enables dynamic routing. Since we usually add one single catch-all route per project, there is no big benefit in supporting a special syntax for `*`. The encoding of params is encoding across routes, without exception to make things easier to predict.

### The `currentRoute` property is now a `ref()`

Previously the properties of the [`currentRoute`](https://v3.router.vuejs.org/api/#router-currentroute) object on a router instance could be accessed directly.

With the introduction of vue-router v4, the underlying type of the `currentRoute` object on the router instance has changed to `Ref<RouteLocationNormalizedLoaded>`, which comes from the newer [reactivity fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) introduced in Vue 3.

While this doesn't change anything if you're reading the route with `useRoute()` or `this.$route`, if you're accessing it directly on the router instance, you will need to access the actual route object via `currentRoute.value`:

```ts
const { page } = router.currentRoute.query // [!code --]
const { page } = router.currentRoute.value.query // [!code ++]
```

### Replaced `onReady` with `isReady`

The existing `router.onReady()` function has been replaced with `router.isReady()` which doesn't take any argument and returns a Promise:

```js
// replace
router.onReady(onSuccess, onError)
// with
router.isReady().then(onSuccess).catch(onError)
// or use await:
try {
  await router.isReady()
  // onSuccess
} catch (err) {
  // onError
}
```

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

**Reason**: This was a necessary change. See the [related RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0034-router-view-keep-alive-transitions.md).

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

Both `event`, and `tag` props have been removed from `<router-link>`. You can use the [`v-slot` API](/guide/advanced/composition-api#uselink) to fully customize `<router-link>`:

```html
replace
<router-link to="/about" tag="span" event="dblclick">About Us</router-link>
with
<router-link to="/about" custom v-slot="{ navigate }">
  <span @click="navigate" @keypress.enter="navigate" role="link">About Us</span>
</router-link>
```

**Reason**: These props were often used together to use something different from an `<a>` tag but were introduced before the `v-slot` API and are not used enough to justify adding to the bundle size for everybody.

### Removal of the `exact` prop in `<router-link>`

The `exact` prop has been removed because the caveat it was fixing is no longer present so you should be able to safely remove it. There are however two things you should be aware of:

- Routes are now active based on the route records they represent instead of the generated route location objects and their `path`, `query`, and `hash` properties
- Only the `path` section is matched, `query`, and `hash` aren't taken into account anymore

If you wish to customize this behavior, e.g. take into account the `hash` section, you should use the [`v-slot` API](/guide/advanced/composition-api#uselink) to extend `<router-link>`.

**Reason**: See the [RFC about active matching](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0028-router-active-link.md#summary) changes for more details.

### Navigation guards in mixins are ignored

At the moment navigation guards in mixins are not supported. You can track its support at [vue-router#454](https://github.com/vuejs/router/issues/454).

### Removal of `router.match` and changes to `router.resolve`

Both `router.match`, and `router.resolve` have been merged together into `router.resolve` with a slightly different signature. [Refer to the API](/api/interfaces/Router.md#Methods-resolve) for more details.

**Reason**: Uniting multiple methods that were used for the same purpose.

### Removal of `router.getMatchedComponents()`

The method `router.getMatchedComponents` is now removed as matched components can be retrieved from `router.currentRoute.value.matched`:

```js
router.currentRoute.value.matched.flatMap(record =>
  Object.values(record.components)
)
```

**Reason**: This method was only used during SSR and is a one liner that can be done by the user.

### Redirect records cannot use special paths

Previously, a non documented feature allowed to set a redirect record to a special path like `/events/:id` and it would reuse an existing param `id`. This is no longer possible and there are two options:

- Using the name of the route without the param: `redirect: { name: 'events' }`. Note this won't work if the param `:id` is optional
- Using a function to recreate the new location based on the target: `redirect: to => ({ name: 'events', params: to.params })`

**Reason**: This syntax was rarely used and _another way of doing things_ that wasn't shorter enough compared to the versions above while introducing some complexity and making the router heavier.

### **All** navigations are now always asynchronous

All navigations, including the first one, are now asynchronous, meaning that, if you use a `transition`, you may need to wait for the router to be _ready_ before mounting the app:

```js
app.use(router)
// Note: on Server Side, you need to manually push the initial location
router.isReady().then(() => app.mount('#app'))
```

Otherwise there will be an initial transition as if you provided the `appear` prop to `transition` because the router displays its initial location (nothing) and then displays the first location.

Note that **if you have navigation guards upon the initial navigation**, you might not want to block the app render until they are resolved unless you are doing Server Side Rendering. In this scenario, not waiting the router to be ready to mount the app would yield the same result as in Vue 2.

### Removal of `router.app`

`router.app` used to represent the last root component (Vue instance) that injected the router. Vue Router can now be safely used by multiple Vue applications at the same time. You can still add it when using the router:

```js
app.use(router)
router.app = app
```

You can also extend the TypeScript definition of the `Router` interface to add the `app` property.

**Reason**: Vue 3 applications do not exist in Vue 2 and now we properly support multiple applications using the same Router instance, so having an `app` property would have been misleading because it would have been the application instead of the root instance.

### Passing content to route components' `<slot>`

Before you could directly pass a template to be rendered by a route components' `<slot>` by nesting it under a `<router-view>` component:

```html
<router-view>
  <p>In Vue Router 3, I render inside the route component</p>
</router-view>
```

Because of the introduction of the `v-slot` api for `<router-view>`, you must pass it to the `<component>` using the `v-slot` API:

```html
<router-view v-slot="{ Component }">
  <component :is="Component">
    <p>In Vue Router 3, I render inside the route component</p>
  </component>
</router-view>
```

### Removal of `parent` from route locations

The `parent` property has been removed from normalized route locations (`this.$route` and object returned by `router.resolve`). You can still access it via the `matched` array:

```js
const parent = this.$route.matched[this.$route.matched.length - 2]
```

**Reason**: Having `parent` and `children` creates unnecessary circular references while the properties could be retrieved already through `matched`.

### Removal of `pathToRegexpOptions`

The `pathToRegexpOptions` and `caseSensitive` properties of route records have been replaced with `sensitive` and `strict` options for `createRouter()`. They can now also be directly passed when creating the router with `createRouter()`. Any other option specific to `path-to-regexp` has been removed as `path-to-regexp` is no longer used to parse paths.

### Removal of unnamed parameters

Due to the removal of `path-to-regexp`, unnamed parameters are no longer supported:

- `/foo(/foo)?/suffix` becomes `/foo/:_(foo)?/suffix`
- `/foo(foo)?` becomes `/foo:_(foo)?`
- `/foo/(.*)` becomes `/foo/:_(.*)`

:::tip
Note you can use any name instead of `_` for the param. The point is to provide one.
:::

### Usage of `history.state`

Vue Router saves information on the `history.state`. If you have any code manually calling `history.pushState()`, you should likely avoid it or refactor it with a regular `router.push()` and a `history.replaceState()`:

```js
// replace
history.pushState(myState, '', url)
// with
await router.push(url)
history.replaceState({ ...history.state, ...myState }, '')
```

Similarly, if you were calling `history.replaceState()` without preserving the current state, you will need to pass the current `history.state`:

```js
// replace
history.replaceState({}, '', url)
// with
history.replaceState(history.state, '', url)
```

**Reason**: We use the history state to save information about the navigation like the scroll position, previous location, etc.

### `routes` option is required in `options`

The property `routes` is now required in `options`.

```js
createRouter({ routes: [] })
```

**Reason**: The router is designed to be created with routes even though you can add them later on. You need at least one route in most scenarios and this is written once per app in general.

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
const routes = [{ path: '/users/:id', name: 'user', component: UserDetails }]

// Missing the `id` param will fail
router.push({ name: 'user' })
router.resolve({ name: 'user' })
```

**Reason**: Same as above.

### Named children routes with an empty `path` no longer appends a slash

Given any nested named route with an empty `path`:

```js
const routes = [
  {
    path: '/dashboard',
    name: 'dashboard-parent',
    component: DashboardParent,
    children: [
      { path: '', name: 'dashboard', component: DashboardDefault },
      {
        path: 'settings',
        name: 'dashboard-settings',
        component: DashboardSettings,
      },
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
    component: Parent,
    children: [
      // this would now redirect to `/home` instead of `/parent/home`
      { path: '', redirect: 'home' },
      { path: 'home', component: Home },
    ],
  },
]
```

Note this will work if `path` was `/parent/` as the relative location `home` to `/parent/` is indeed `/parent/home` but the relative location of `home` to `/parent` is `/home`.

<!-- Learn more about relative links [in the cookbook](../../cookbook/relative-links.md). -->

**Reason**: This is to make trailing slash behavior consistent: by default all routes allow a trailing slash. It can be disabled by using the `strict` option and manually appending (or not) a slash to the routes.

<!-- TODO: maybe a cookbook entry -->

### `$route` properties Encoding

Decoded values in `params`, `query`, and `hash` are now consistent no matter where the navigation is initiated (older browsers will still produce unencoded `path` and `fullPath`). The initial navigation should yield the same results as in-app navigations.

Given any [normalized route location](/api/interfaces/RouteLocationNormalized.md):

- Values in `path`, `fullPath` are not decoded anymore. They will appear as provided by the browser (most browsers provide them encoded). e.g. directly writing on the address bar `https://example.com/hello world` will yield the encoded version: `https://example.com/hello%20world` and both `path` and `fullPath` will be `/hello%20world`.
- `hash` is now decoded, that way it can be copied over: `router.push({ hash: $route.hash })` and be used directly in [scrollBehavior](/api/interfaces/RouterOptions.md#Properties-scrollBehavior)'s `el` option.
- When using `push`, `resolve`, and `replace` and providing a `string` location or a `path` property in an object, **it must be encoded** (like in the previous version). On the other hand, `params`, `query` and `hash` must be provided in its unencoded version.
- The slash character (`/`) is now properly decoded inside `params` while still producing an encoded version on the URL: `%2F`.

**Reason**: This allows to easily copy existing properties of a location when calling `router.push()` and `router.resolve()`, and make the resulting route location consistent across browsers. `router.push()` is now idempotent, meaning that calling `router.push(route.fullPath)`, `router.push({ hash: route.hash })`, `router.push({ query: route.query })`, and `router.push({ params: route.params })` will not create extra encoding.

### TypeScript changes

To make typings more consistent and expressive, some types have been renamed:

| `vue-router@3` | `vue-router@4`          |
| -------------- | ----------------------- |
| RouteConfig    | RouteRecordRaw          |
| Location       | RouteLocation           |
| Route          | RouteLocationNormalized |

## New Features

Some of new features to keep an eye on in Vue Router 4 include:

- [Dynamic Routing](../advanced/dynamic-routing.md)
- [Composition API](../advanced/composition-api.md)
<!-- - Custom History implementation -->
