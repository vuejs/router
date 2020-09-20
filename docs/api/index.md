---
sidebar: auto
---

# API Reference

## `<router-link>` Props

### to

- **Type**: [`RouteLocationRaw`](#routelocationraw)
- **Details**:

  Denotes the target route of the link. When clicked, the value of the `to` prop will be passed to `router.push()` internally, so it can either be a `string` or a [route location object](#routelocationraw).

```html
<!-- literal string -->
<router-link to="/home">Home</router-link>
<!-- renders to -->
<a href="/home">Home</a>

<!-- javascript expression using `v-bind` -->
<router-link :to="'/home'">Home</router-link>

<!-- same as above -->
<router-link :to="{ path: '/home' }">Home</router-link>

<!-- named route -->
<router-link :to="{ name: 'user', params: { userId: '123' }}">User</router-link>

<!-- with query, resulting in `/register?plan=private` -->
<router-link :to="{ path: '/register', query: { plan: 'private' }}">
  Register
</router-link>
```

### replace

- **Type**: `boolean`
- **Default**: `false`
- **Details**:

  Setting `replace` prop will call `router.replace()` instead of `router.push()` when clicked, so the navigation will not leave a history record.

```html
<router-link to="/abc" replace></router-link>
```

### active-class

- **Type**: `string`
- **Default**: `"router-link-active"` (or global [`linkActiveClass`](#linkactiveclass))
- **Details**:

  Class to apply on the rendered `<a>` when the link is active.

### aria-current-value

- **Type**: `'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'` (`string`)
- **Default**: `"page"`
- **Details**:

  Value passed to the attribute `aria-current` when the link is exactly active.

### custom

- **Type**: `boolean`
- **Default**: `false`
- **Details**:

  Whether `<router-link>` should not wrap its content in an `<a>` element. Useful when using [`v-slot`](#router-link-s-v-slot) to create a custom RouterLink. By default, `<router-link>` will render its content wrapped in an `<a>` element, even when using `v-slot`. Passing the `custom` prop, removes that behavior.

- **Examples**:

  ```html
  <router-link to="/home" custom v-slot="{ navigate, href, route }">
    <a :href="href" @click="navigate">{{ route.fullPath }}</a>
  </router-link>
  ```

  Renders `<a href="/home">/home</a>`.

  ```html
  <router-link to="/home" v-slot="{ route }">
    <span>{{ route.fullPath }}</span>
  </router-link>
  ```

  Renders `<a href="/home"><span>/home</span></a>`.

### exact-active-class

- **Type**: `string`
- **Default**: `"router-link-exact-active"` (or global [`linkExactActiveClass`](#linkexactactiveclass))
- **Details**:

  Class to apply on the rendered `<a>` when the link is exact active.

## `<router-link>`'s `v-slot`

`<router-link>` exposes a low level customization through a [scoped slot](https://v3.vuejs.org/guide/component-slots.html#scoped-slots). This is a more advanced API that primarily targets library authors but can come in handy for developers as well, to build a custom component like a _NavLink_ or other.

:::tip
Remember to pass the `custom` option to `<router-link>` to prevent it from wrapping its content inside of an `<a>` element.
:::

```html
<router-link
  to="/about"
  custom
  v-slot="{ href, route, navigate, isActive, isExactActive }"
>
  <NavLink :active="isActive" :href="href" @click="navigate">
    {{ route.fullPath }}
  </NavLink>
</router-link>
```

- `href`: resolved url. This would be the `href` attribute of an `<a>` element. It contains the `base` if any was provided.
- `route`: resolved normalized location.
- `navigate`: function to trigger the navigation. **It will automatically prevent events when necessary**, the same way `router-link` does, e.g. `ctrl` or `cmd` + click will still be ignored by `navigate`.
- `isActive`: `true` if the [active class](#active-class) should be applied. Allows to apply an arbitrary class.
- `isExactActive`: `true` if the [exact active class](#exact-active-class) should be applied. Allows to apply an arbitrary class.

### Example: Applying Active Class to Outer Element

Sometimes we may want the active class to be applied to an outer element rather than the `<a>` element itself, in that case, you can wrap that element inside a `router-link` and use the `v-slot` properties to create your link:

```html
<router-link
  to="/foo"
  custom
  v-slot="{ href, route, navigate, isActive, isExactActive }"
>
  <li
    :class="[isActive && 'router-link-active', isExactActive && 'router-link-exact-active']"
  >
    <a :href="href" @click="navigate">{{ route.fullPath }}</a>
  </li>
</router-link>
```

:::tip
If you add a `target="_blank"` to your `a` element, you must omit the `@click="navigate"` handler.
:::

## `<router-view>` Props

### name

- **Type**: `string`
- **Default**: `"default"`
- **Details**:

  When a `<router-view>` has a `name`, it will render the component with the corresponding name in the matched route record's `components` option.

- **See Also**: [Named Views](/guide/essentials/named-views.md)

### route

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Details**:

  A route location that has all of its component resolved (if any was lazy loaded) so it can be displayed.

## `<router-view>`'s `v-slot`

`<router-view>` exposes a `v-slot` API mainly to wrap your route components with `<transition>` and `<keep-alive>` components.

```html
<router-view v-slot="{ Component, route }">
  <component :is="Component" />
</router-view>
```

- `Component`: VNodes to be passed to a `<component>`'s `is` prop.
- `route`: resolved normalized [route location](#routelocationnormalized).

## createRouter

Creates a Router instance that can be used by a Vue app. Check the [`RouterOptions`](#routeroptions) for a list of all the properties that can be passed.

**Signature:**

```typescript
export declare function createRouter(options: RouterOptions): Router
```

### Parameters

| Parameter | Type                            | Description                      |
| --------- | ------------------------------- | -------------------------------- |
| options   | [RouterOptions](#routeroptions) | Options to initialize the router |

## createWebHistory

Creates an HTML5 history. Most common history for single page applications. The application must be served through the http protocol.

**Signature:**

```typescript
export declare function createWebHistory(base?: string): RouterHistory
```

### Parameters

| Parameter | Type     | Description                                                                                                           |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| base      | `string` | optional base to provide. Useful when the application is hosted inside of a folder like `https://example.com/folder/` |

### Examples

```js
createWebHistory() // No base, the app is hosted at the root of the domain `https://example.com`
createWebHistory('/folder/') // gives a url of `https://example.com/folder/`
```

## createWebHashHistory

Creates a hash history. Useful for web applications with no host (e.g. `file://`) or when configuring a server to handle any URL isn't an option. **Note you should use [`createWebHistory`](#createwebhistory) if SEO matters to you**.

**Signature:**

```typescript
export declare function createWebHashHistory(base?: string): RouterHistory
```

### Parameters

| Parameter | Type     | Description                                                                                                                                         |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| base      | `string` | optional base to provide. Defaults to `location.pathname` or `/` if at root. If there is a `base` tag in the `head`, its value will be **ignored**. |

### Examples

```js
// at https://example.com/folder
createWebHashHistory() // gives a url of `https://example.com/folder#`
createWebHashHistory('/folder/') // gives a url of `https://example.com/folder/#`
// if the `#` is provided in the base, it won't be added by `createWebHashHistory`
createWebHashHistory('/folder/#/app/') // gives a url of `https://example.com/folder/#/app/`
// you should avoid doing this because it changes the original url and breaks copying urls
createWebHashHistory('/other-folder/') // gives a url of `https://example.com/other-folder/#`

// at file:///usr/etc/folder/index.html
// for locations with no `host`, the base is ignored
createWebHashHistory('/iAmIgnored') // gives a url of `file:///usr/etc/folder/index.html#`
```

## createMemoryHistory

Creates a in-memory based history. The main purpose of this history is to handle SSR. It starts in a special location that is nowhere. If the user is not on a browser context, it's up to them to replace that location with the starter location by either calling `router.push()` or `router.replace()`.

**Signature:**

```typescript
export declare function createMemoryHistory(base?: string): RouterHistory
```

### Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| base      | `string` | Base applied to all urls, defaults to '/' |

### Returns

A history object that can be passed to the router constructor

## NavigationFailureType

Enumeration with all possible types for navigation failures. Can be passed to [isNavigationFailure](#isnavigationfailure) to check for specific failures. **Never use any of the numerical values**, always use the variables like `NavigationFailureType.aborted`.

**Signature:**

```typescript
export declare enum NavigationFailureType
```

### Members

| Member     | Value | Description                                                                                                                      |
| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| aborted    | 4     | An aborted navigation is a navigation that failed because a navigation guard returned `false` or called `next(false)`            |
| cancelled  | 8     | A cancelled navigation is a navigation that failed because a more recent navigation finished started (not necessarily finished). |
| duplicated | 16    | A duplicated navigation is a navigation that failed because it was initiated while already being at the exact same location.     |

## START_LOCATION

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Details**:

  Initial route location where the router is. Can be used in navigation guards to differentiate the initial navigation.

  ```js
  import { START_LOCATION } from 'vue-router'

  router.beforeEach((to, from) => {
    if (from === START_LOCATION) {
      // initial navigation
    }
  })
  ```

## Composition API

### onBeforeRouteLeave

Add a navigation guard that triggers whenever the component for the current location is about to be left. Similar to `beforeRouteLeave` but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**

```typescript
export declare function onBeforeRouteLeave(leaveGuard: NavigationGuard): void
```

#### Parameters

| Parameter  | Type                                  | Description             |
| ---------- | ------------------------------------- | ----------------------- |
| leaveGuard | [`NavigationGuard`](#navigationguard) | Navigation guard to add |

### onBeforeRouteUpdate

Add a navigation guard that triggers whenever the current location is about to be updated. Similar to `beforeRouteUpdate` but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**

```typescript
export declare function onBeforeRouteUpdate(updateGuard: NavigationGuard): void
```

#### Parameters

| Parameter   | Type                                  | Description             |
| ----------- | ------------------------------------- | ----------------------- |
| updateGuard | [`NavigationGuard`](#navigationguard) | Navigation guard to add |

### useLink

Returns everything exposed by the [`v-slot` API](#router-link-s-v-slot).

**Signature:**

```typescript
export declare function useLink(props: RouterLinkOptions): {
  route: ComputedRef<RouteLocationNormalized & { href: string }>,
  href: ComputedRef<string>,
  isActive: ComputedRef<boolean>,
  isExactActive: ComputedRef<boolean>,
  navigate: (event?: MouseEvent) => Promise(NavigationFailure | void),
}
```

#### Parameters

| Parameter | Type              | Description                                                                           |
| --------- | ----------------- | ------------------------------------------------------------------------------------- |
| props     | RouterLinkOptions | props object that can be passed to `<router-link>`. Accepts `Ref`s and `ComputedRef`s |

### useRoute

Returns the current route location. Equivalent to using `$route` inside templates. Must be called inside of `setup()`.

**Signature:**

```typescript
export declare function userRoute(): RouteLocationNormalized
```

### useRouter

Returns the [router](#Router) instance. Equivalent to using `$router` inside templates. Must be called inside of `setup()`.

**Signature:**

```typescript
export declare function userRouter(): Router
```

## TypeScript

Here are some of the interfaces and types used by Vue Router. The documentation references them to give you an idea of the existing properties in objects.

## Router Properties

### currentRoute

- **Type**: [`Ref<RouteLocationNormalized>`](#routelocationnormalized)
- **Details**:

  Current route location. Readonly.

### options

- **Type**: [`RouterOptions`](#routeroptions)
- **Details**:

  Original options object passed to create the Router. Readonly.

## Router Methods

### addRoute

Add a new [Route Record](.#routerecordraw) as the child of an existing route. If the route has a `name` and there is already an existing one with the same one, it removes it first.

**Signature:**

```typescript
addRoute(parentName: string | symbol, route: RouteRecordRaw): () => void
```

_Parameters_

| Parameter  | Type                                | Description         |
| ---------- | ----------------------------------- | ------------------- |
| parentName | `string                             | symbol`             | Parent Route Record where `route` should be appended at |
| route      | [`RouteRecordRaw`](#routerecordraw) | Route Record to add |

### addRoute

Add a new [route record](#routerecordraw) to the router. If the route has a `name` and there is already an existing one with the same one, it removes it first.

**Signature:**

```typescript
addRoute(route: RouteRecordRaw): () => void
```

_Parameters_

| Parameter | Type                                | Description         |
| --------- | ----------------------------------- | ------------------- |
| route     | [`RouteRecordRaw`](#routerecordraw) | Route Record to add |

:::tip
Note adding routes does not trigger a new navigation, meaning that the added route will not be displayed unless a new navigation is triggered.
:::

### afterEach

Add a navigation hook that is executed after every navigation. Returns a function that removes the registered hook.

**Signature:**

```typescript
afterEach(guard: NavigationHookAfter): () => void
```

_Parameters_

| Parameter | Type                | Description            |
| --------- | ------------------- | ---------------------- |
| guard     | NavigationHookAfter | navigation hook to add |

#### Examples

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

### back

Go back in history if possible by calling `history.back()`. Equivalent to `router.go(-1)`.

**Signature:**

```typescript
back(): void
```

### beforeEach

Add a navigation guard that executes before any navigation. Returns a function that removes the registered guard.

**Signature:**

```typescript
beforeEach(guard: NavigationGuard): () => void
```

_Parameters_

| Parameter | Type                                  | Description             |
| --------- | ------------------------------------- | ----------------------- |
| guard     | [`NavigationGuard`](#navigationguard) | navigation guard to add |

### beforeResolve

Add a navigation guard that executes before navigation is about to be resolved. At this state all component have been fetched and other navigation guards have been successful. Returns a function that removes the registered guard.

**Signature:**

```typescript
beforeResolve(guard: NavigationGuard): () => void
```

_Parameters_

| Parameter | Type                                  | Description             |
| --------- | ------------------------------------- | ----------------------- |
| guard     | [`NavigationGuard`](#navigationguard) | navigation guard to add |

#### Examples

```js
router.beforeEach(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

### forward

Go forward in history if possible by calling `history.forward()`. Equivalent to `router.go(1)`.

**Signature:**

```typescript
forward(): void
```

### getRoutes

Get a full list of all the [route records](#routerecord).

**Signature:**

```typescript
getRoutes(): RouteRecord[]
```

### go

Allows you to move forward or backward through the history.

**Signature:**

```typescript
go(delta: number): void
```

_Parameters_

| Parameter | Type     | Description                                                                         |
| --------- | -------- | ----------------------------------------------------------------------------------- |
| delta     | `number` | The position in the history to which you want to move, relative to the current page |

### hasRoute

Checks if a route with a given name exists

**Signature:**

```typescript
hasRoute(name: string | symbol): boolean
```

_Parameters_

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| name      | `string | symbol`     | Name of the route to check |

### isReady

Returns a Promise that resolves when the router has completed the initial navigation, which means it has resolved all async enter hooks and async components that are associated with the initial route. If the initial navigation already happened, the promise resolves immediately.This is useful in server-side rendering to ensure consistent output on both the server and the client. Note that on server side, you need to manually push the initial location while on client side, the router automatically picks it up from the URL.

**Signature:**

```typescript
isReady(): Promise<void>
```

### onError

Adds an error handler that is called every time a non caught error happens during navigation. This includes errors thrown synchronously and asynchronously, errors returned or passed to `next` in any navigation guard, and errors occurred when trying to resolve an async component that is required to render a route.

**Signature:**

```typescript
onError(handler: (error: any) => any): () => void
```

_Parameters_

| Parameter | Type                  | Description               |
| --------- | --------------------- | ------------------------- |
| handler   | `(error: any) => any` | error handler to register |

### push

Programmatically navigate to a new URL by pushing an entry in the history stack.

**Signature:**

```typescript
push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

_Parameters_

| Parameter | Type                                    | Description                   |
| --------- | --------------------------------------- | ----------------------------- |
| to        | [`RouteLocationRaw`](#routelocationraw) | Route location to navigate to |

### removeRoute

Remove an existing route by its name.

**Signature:**

```typescript
removeRoute(name: string | symbol): void
```

_Parameters_

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| name      | `string | symbol`     | Name of the route to remove |

### replace

Programmatically navigate to a new URL by replacing the current entry in the history stack.

**Signature:**

```typescript
replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

_Parameters_

| Parameter | Type                                    | Description                   |
| --------- | --------------------------------------- | ----------------------------- |
| to        | [`RouteLocationRaw`](#routelocationraw) | Route location to navigate to |

### resolve

Returns the [normalized version](./vue-router-interface#routelocation) of a [route location](./vue-router-typealias#routelocationraw). Also includes an `href` property that includes any existing `base`.

**Signature:**

```typescript
resolve(to: RouteLocationRaw): RouteLocation & {
        href: string
    }
```

_Parameters_

| Parameter | Type                                    | Description                   |
| --------- | --------------------------------------- | ----------------------------- |
| to        | [`RouteLocationRaw`](#routelocationraw) | Raw route location to resolve |

## RouterOptions

### history

History implementation used by the router. Most web applications should use `createWebHistory` but it requires the server to be properly configured. You can also use a _hash_ based history with `createWebHashHistory` that does not require any configuration on the server but isn't handled at all by search engines and does poorly on SEO.

**Signature:**

```typescript
history: RouterHistory
```

#### Examples

```js
createRouter({
  history: createWebHistory(),
  // other options...
})
```

### linkActiveClass

Default class applied to active [RouterLink](#router-link-props). If none is provided, `router-link-active` will be applied.

**Signature:**

```typescript
linkActiveClass?: string
```

### linkExactActiveClass

Default class applied to exact active [RouterLink](#router-link-props). If none is provided, `router-link-exact-active` will be applied.

**Signature:**

```typescript
linkExactActiveClass?: string
```

### parseQuery

Custom implementation to parse a query. See its counterpart, [stringifyQuery](#stringifyquery).

**Signature:**

```typescript
parseQuery?: typeof originalParseQuery
```

#### Examples

Let's say you want to use the package [qs](https://github.com/ljharb/qs) to parse queries, you can provide both `parseQuery` and `stringifyQuery`:

```js
import qs from 'qs'

createRouter({
  // other options...
  parse: qs.parse,
  stringifyQuery: qs.stringify,
})
```

### routes

Initial list of routes that should be added to the router.

**Signature:**

```typescript
routes: RouteRecordRaw[]
```

### scrollBehavior

Function to control scrolling when navigating between pages. Can return a Promise to delay scrolling. Check .

**Signature:**

```typescript
scrollBehavior?: ScrollBehavior
```

#### Examples

```js
function scrollBehavior(to, from, savedPosition) {
  // `to` and `from` are both route locations
  // `savedPosition` can be null if there isn't one
}
```

### stringifyQuery

Custom implementation to stringify a query object. Should not prepend a leading `?`. [parseQuery](#parsequery) counterpart to handle query parsing.

**Signature:**

```typescript
stringifyQuery?: typeof originalStringifyQuery
```

## RouteRecordRaw

Route record that can be provided by the user when adding routes via the [`routes` option](#routeroptions) or via [`router.addRoutes()`](#addroutes). There are three different kind of route records:

- Single views records: have a `component` option
- Multiple views records ([named views](/guide/essentials/named-views.md)): have a `components` option
- Redirect records: cannot have `component` or `components` option because a redirect record is never reached.

### path

- **Type**: `string`
- **Details**:

  Path of the record. Should start with `/` unless the record is the child of another record.
  Can define parameters: `/users/:id` matches `/users/1` as well as `/users/posva`.

- **See Also**: [Dynamic Route Matching](/guide/essentials/dynamic-matching.md)

### redirect

- **Type**: `RouteLocationRaw | (to: RouteLocationNormalized) => RouteLocationRaw` (Optional)
- **Details**:

  Where to redirect if the route is directly matched. The redirection happens
  before any navigation guard and triggers a new navigation with the new target
  location. Can also be a function that receives the target route location and
  returns the location we should redirect to.

### children

- **Type**: Array of [`RouteRecordRaw`](#routerecordraw) (Optional)
- **Details**:

  Nested routes of the current record.

- **See Also**: [Nested Routes](/guide/advanced/nested-routes.md)

### alias

- **Type**: `string | string[]` (Optional)
- **Details**:

  Aliases for the route. Allows defining extra paths that will behave like a
  copy of the record. This enables paths shorthands like `/users/:id` and
  `/u/:id`. **All `alias` and `path` values must share the same params**.

### name

- **Type**: `string | symbol` (Optional)
- **Details**:

  Unique name for the route record.

### beforeEnter

- **Type**: [`NavigationGuard | NavigationGuard[]`](#navigationguard) (Optional)
- **Details**:

  Before enter guard specific to this record. Note `beforeEnter` has no effect if the record has a `redirect` property.

### props

- **Type**: `boolean | Record<string, any> | (to: RouteLocationNormalized) => Record<string, any>` (Optional)
- **Details**:

  Allows passing down params as props to the component rendered by `router-view`. When passed to a _multiple views record_, it should be an object with the same keys as `components` or a `boolean` to be applied to each component.
  target location.

- **See Also**: [Passing props to Route Components](/guide/essentials/passing-props.md)

### meta

- **Type**: [`RouteMeta`](#routemeta) (Optional)
- **Details**:

  Custom data attached to the record.

- **See Also**: [Meta fields](/guide/advanced/meta.md)

## RouteRecordNormalized

Normalized version of a [Route Record](#routerecordraw)

### aliasOf

- **Type**: `RouteRecordNormalized | undefined`
- **Details**:

  Defines if this record is the alias of another one. This property is `undefined` if the record is the original one.

### beforeEnter

- **Type**: [`NavigationGuard`](#navigationguard)
- **Details**:

  Navigation guard applied when entering this record from somewhere else.

- **See Also**: [Navigation guards](/guide/advanced/navigation-guards.md)

### children

- **Type**: Array of normalized [route records](#routerecordnormalized)
- **Details**:

  Children route records of the current route. Empty array if none.

### components

- **Type**: `Record<string, Component>`
- **Details**:

  Dictionary of named views, if none, contains an object with the key `default`.

### meta

- **Type**: `RouteMeta`
- **Details**:

  Arbitrary data attached to the record.

- **See also**: [Meta fields](/guide/advanced/meta.md)

### name

- **Type**: `string | symbol | undefined`
- **Details**:

  Name for the route record. `undefined` if none was provided.

### path

- **Type**: `string`
- **Details**:

  Normalized path of the record. Includes any parent's `path`.

### props

- **Type**: `Record<string, boolean | Function | Record<string, any>>`
- **Details**:

  Dictionary of the [`props` option](#props) for each named view. If none, it will contain only one property named `default`.

### redirect

- **Type**: [`RouteLocationRaw`](#routelocationraw)
- **Details**:

  Where to redirect if the route is directly matched. The redirection happens before any navigation guard and triggers a new navigation with the new target location.

## RouteLocationRaw

User-level route location that can be passed to `router.push()`, `redirect`, and returned in [Navigation Guards](/guide/advanced/navigation-guards.md).

A raw location can either be a `string` like `/users/posva#bio` or an object:

```js
// these three forms are equivalent
router.push('/users/posva#bio)
router.push({ path: '/users/posva', hash: '#bio' })
router.push({ name: 'users', params: { username: 'posva' }, hash: '#bio' })
// only change the hash
router.push({ hash: '#bio' })
// only change query
router.push({ query: { page: '2' } })
// change one param
router.push({ params: { username: 'jolyne' } })
```

Note `path` must be provided encoded (e.g. `phantom blood` becomes `phantom%20blood`) while `params`, `query` and `hash` must not, they are encoded by the router.

Raw route locations also support an extra option `replace` to call `router.replace()` instead of `router.push()` in navigation guards. Note this also internally calls `router.replace()` even when calling `router.push()`:

```js
router.push({ hash: '#bio', replace: true })
// equivalent to
router.replace({ hash: '#bio' })
```

## RouteLocation

Resolved [RouteLocationRaw](#routelocationraw) that can contain [redirect records](#routerecordraw). Apart from that it has the same properties as [RouteLocationNormalized](#routelocationnormalized).

## RouteLocationNormalized

Normalized route location. Does not have any [redirect records](#routerecordraw). In navigation guards, `to` and `from` are always of this type.

### fullPath

- **Type**: `string`
- **Details**:

  Encoded URL associated to the route location. Contains `path`, `query` and `hash`.

### hash

- **Type**: `string`
- **Details**:

  Decoded `hash` section of the URL. Always starts with a `#`. Empty string if there is no `hash` in the URL.

### query

- **Type**: `Record<string, string | string[]>`
- **Details**:

  Dictionary of decoded query params extracted from the `search` section of the URL.

### matched

- **Type**: [`RouteRecordNormalized[]`](#routerecordnormalized)
- **Details**:

  Array of [normalized route records](#routerecord) that were matched with the given route location.

### meta

- **Type**: `RouteMeta`
- **Details**:

  Arbitrary data attached to all matched records merged (non recursively) from parent to child.

- **See also**: [Meta fields](/guide/advanced/meta.md)

### name

- **Type**: `string | symbol | undefined | null`
- **Details**:

  Name for the route record. `undefined` if none was provided.

### params

- **Type**: `Record<string, string | string[]>`
- **Details**:

  Dictionary of decoded params extracted from `path`.

### path

- **Type**: `string`
- **Details**:

  Encoded `pathname` section of the URL associated to the route location.

### redirectedFrom

- **Type**: [`RouteLocation`](#routelocation)
- **Details**:

  Route location we were initially trying to access before ending up on the current location when a `redirect` option was found or a navigation guard called `next()` with a route location. `undefined` if there was no redirection.

## NavigationFailure

### from

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Details**:

  Route location we were navigating from

### to

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Details**:

  Route location we were navigating to

### type

- **Type**: [`NavigationFailureType`](#navigationfailuretype)
- **Details**:

  Type of the navigation failure.

- **See Also**: [Navigation Failures](/guide/advanced/navigation-failures.md)

## NavigationGuard

- **Arguments**:

  - [`RouteLocationNormalized`](#routelocationnormalized) to - Route location we are navigating to
  - [`RouteLocationNormalized`](#routelocationnormalized) from - Route location we are navigating from
  - `Function` next (Optional) - Callback to validate the navigation

- **Details**:

  Function that can be passed to control a router navigation. The `next` callback can be omitted if you return a value (or a Promise) instead, which is encouraged. Possible return values (and parameters for `next`) are:

  - `undefined | void | true`: validates the navigation
  - `false`: cancels the navigation
  - [`RouteLocationRaw`](#routelocationraw): redirects to a different location
  - `(vm: ComponentPublicInstance) => any` **only for `beforeRouteEnter`**: A callback to be executed once the navigation completes. Receives the route component instance as the parameter.

- **See Also**: [Navigation Guards](/guide/advanced/navigation-guards.md)

## Component Injections

### Component Injected Properties

These properties are injected into every child component by calling `app.use(router)`.

- **this.\$router**

  The router instance.

- **this.\$route**

  The current active [route location](#routelocationnormalized). This property is read-only and its properties are immutable, but it can be watched.

### Component Enabled Options

- **beforeRouteEnter**
- **beforeRouteUpdate**
- **beforeRouteLeave**

See [In Component Guards](/guide/advanced/navigation-guards.md).
