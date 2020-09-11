---
sidebar: auto
---

# API Reference

- [Interfaces](./vue-router-interface.md)
- [Types](./vue-router-typealias.md)

## `<router-link>` Props

### to

- type: [`RouteLocationRaw`](#routelocationraw)
- required

Denotes the target route of the link. When clicked, the value of the `to` prop will be passed to `router.push()` internally, so the value can be either a string or a [route location object](#routelocationraw).

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

- type: `boolean`
- default: `false`

Setting `replace` prop will call `router.replace()` instead of `router.push()` when clicked, so the navigation will not leave a history record.

```html
<router-link to="/abc" replace></router-link>
```

### active-class

- type: `string`
- default: `"router-link-active"` (or global [`linkActiveClass`](#linkactiveclass))

Class to apply on the rendered `a` when the link is active.

### aria-current-value

- type: `'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'` (`string`)
- default: `"page"`

Value passed to the attribute `aria-current` when the link is exactly active.

### custom

- type: `boolean`
- default: `false`

Whether `<router-link>` should not wrap its content in an `<a>` element. Useful when using `v-slot` to create a custom RouterLink.

```html
<router-link to="/home" custom v-slot="{ navigate, href, route }">
  <a :href="href" @click="navigate">{{ route.fullPath }}</a>
</router-link>
```

### exact-active-class

- type: `string`
- default: `"router-link-exact-active"` (or global [`linkExactActiveClass`](#linkexactactiveclass))

Class to apply when the link is exact active.

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

- type: `string`
- default: `"default"`

When a `<router-view>` has a `name`, it will render the component with the corresponding name in the matched route record's `components` option. See [Named Views](/guide/essentials/named-views.md) for an example.

### route

- type: `RouteLocationNormalizedLoaded`. A route location that has all of its component resolved (if any was lazy loaded) so it can be displayed.

## createRouter

Creates a Router instance that can be used by a Vue app. Check the [RouterOptions](#routeroptions) for a list of all the properties that can be passed.

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
createWebHistory() // No base, the app is hosted at the root of the domain
createWebHistory('/folder/') // gives a url of `https://example.com/folder/`
```

## createWebHashHistory

Creates a hash history. Useful for web applications with no host (e.g. `file://`) or when configuring a server to handle any URL.

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

Creates a in-memory based history. The main purpose of this history is to handle SSR. It starts in a special location that is nowhere. It's up to the user to replace that location with the starter location by either calling `router.push` or `router.replace`.

**Signature:**

```typescript
export declare function createMemoryHistory(base?: string): RouterHistory
```

### Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| base      | `string` | Base applied to all urls, defaults to '/' |

### Returns

a history object that can be passed to the router constructor

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

Initial route location where the router is. Can be used in navigation guards to differentiate the initial navigation.

**Signature:**

```typescript
START_LOCATION_NORMALIZED: RouteLocationNormalizedLoaded
```

### Examples

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

Add a navigation guard that triggers whenever the component for the current location is about to be left. Similar to but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**

```typescript
export declare function onBeforeRouteLeave(leaveGuard: NavigationGuard): void
```

#### Parameters

| Parameter  | Type            | Description                         |
| ---------- | --------------- | ----------------------------------- |
| leaveGuard | NavigationGuard | [NavigationGuard](#navigationguard) |

### onBeforeRouteUpdate

Add a navigation guard that triggers whenever the current location is about to be updated. Similar to but can be used in any component. The guard is removed when the component is unmounted.

**Signature:**

```typescript
export declare function onBeforeRouteUpdate(updateGuard: NavigationGuard): void
```

#### Parameters

| Parameter   | Type            | Description                         |
| ----------- | --------------- | ----------------------------------- |
| updateGuard | NavigationGuard | [NavigationGuard](#navigationguard) |

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

Returns the current route location. Equivalent to using `$route` inside templates.

**Signature:**

```typescript
export declare function userRoute(): RouteLocationNormalized
```

### useRouter

Returns the [router](#Router) instance. Equivalent to using `$router` inside templates.

**Signature:**

```typescript
export declare function userRouter(): Router
```

## TypeScript

Here are some of the interfaces and types used by Vue Router. The documentation references them to give you an idea of the existing properties in objects.

## Router Properties

### currentRoute

Current [RouteLocationNormalized](#routelocationnormalized)

**Signature:**

```typescript
readonly currentRoute: Ref<RouteLocationNormalizedLoaded>;
```

### options

Original options object passed to create the Router

**Signature:**

```typescript
readonly options: RouterOptions;
```

## Router Methods

### addRoute

Add a new [Route Record](.#routerecordraw) as the child of an existing route.

**Signature:**

```typescript
addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void;
```

_Parameters_

| Parameter  | Type            | Description                                             |
| ---------- | --------------- | ------------------------------------------------------- |
| parentName | RouteRecordName | Parent Route Record where `route` should be appended at |
| route      | RouteRecordRaw  | Route Record to add                                     |

### addRoute

Add a new [route record](#routerecordraw) to the router.

**Signature:**

```typescript
addRoute(route: RouteRecordRaw): () => void;
```

_Parameters_

| Parameter | Type           | Description         |
| --------- | -------------- | ------------------- |
| route     | RouteRecordRaw | Route Record to add |

### afterEach

Add a navigation hook that is executed after every navigation. Returns a function that removes the registered hook.

**Signature:**

```typescript
afterEach(guard: NavigationHookAfter): () => void;
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

Go back in history if possible by calling `history.back()`. Equivalent to `router.go(-1)`. Returns a Promise. See the limitations at [`router.go()`](#go).

**Signature:**

```typescript
back(): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


### beforeEach

Add a navigation guard that executes before any navigation. Returns a function that removes the registered guard.

**Signature:**

```typescript
beforeEach(guard: NavigationGuardWithThis<undefined>): () => void;
```

_Parameters_

| Parameter | Type                                     | Description             |
| --------- | ---------------------------------------- | ----------------------- |
| guard     | NavigationGuardWithThis&lt;undefined&gt; | navigation guard to add |

### beforeResolve

Add a navigation guard that executes before navigation is about to be resolved. At this state all component have been fetched and other navigation guards have been successful. Returns a function that removes the registered guard.

**Signature:**

```typescript
beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void;
```

_Parameters_

| Parameter | Type                                     | Description             |
| --------- | ---------------------------------------- | ----------------------- |
| guard     | NavigationGuardWithThis&lt;undefined&gt; | navigation guard to add |

#### Examples

```js
router.beforeEach(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

### forward

Go forward in history if possible by calling `history.forward()`. Equivalent to `router.go(1)`. Returns a Promise. See the limitations at [go](./vue-router-interface#router.go).

**Signature:**

```typescript
forward(): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


### getRoutes

Get a full list of all the [route records](#routerecord).

**Signature:**

```typescript
getRoutes(): RouteRecord[];
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


### go

Allows you to move forward or backward through the history. Returns a Promise that resolves when the navigation finishes. If it wasn't possible to go back, the promise never resolves or rejects

**Signature:**

```typescript
go(delta: number): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type   | Description                                                                         |
| --------- | ------ | ----------------------------------------------------------------------------------- |
| delta     | number | The position in the history to which you want to move, relative to the current page |

### hasRoute

Checks if a route with a given name exists

**Signature:**

```typescript
hasRoute(name: RouteRecordName): boolean;
```

_Parameters_

| Parameter | Type            | Description                |
| --------- | --------------- | -------------------------- |
| name      | RouteRecordName | Name of the route to check |

### isReady

Returns a Promise that resolves when the router has completed the initial navigation, which means it has resolved all async enter hooks and async components that are associated with the initial route. If the initial navigation already happened, the promise resolves immediately.This is useful in server-side rendering to ensure consistent output on both the server and the client. Note that on server side, you need to manually push the initial location while on client side, the router automatically picks it up from the URL.

**Signature:**

```typescript
isReady(): Promise<void>;
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


### onError

Adds an error handler that is called every time a non caught error happens during navigation. This includes errors thrown synchronously and asynchronously, errors returned or passed to `next` in any navigation guard, and errors occurred when trying to resolve an async component that is required to render a route.

**Signature:**

```typescript
onError(handler: ErrorHandler): () => void;
```

_Parameters_

| Parameter | Type         | Description               |
| --------- | ------------ | ------------------------- |
| handler   | ErrorHandler | error handler to register |

### push

Programmatically navigate to a new URL by pushing an entry in the history stack.

**Signature:**

```typescript
push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type             | Description                   |
| --------- | ---------------- | ----------------------------- |
| to        | RouteLocationRaw | Route location to navigate to |

### removeRoute

Remove an existing route by its name.

**Signature:**

```typescript
removeRoute(name: RouteRecordName): void;
```

_Parameters_

| Parameter | Type            | Description                 |
| --------- | --------------- | --------------------------- |
| name      | RouteRecordName | Name of the route to remove |

### replace

Programmatically navigate to a new URL by replacing the current entry in the history stack.

**Signature:**

```typescript
replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type             | Description                   |
| --------- | ---------------- | ----------------------------- |
| to        | RouteLocationRaw | Route location to navigate to |

### resolve

Returns the [normalized version](./vue-router-interface#routelocation) of a [route location](./vue-router-typealias#routelocationraw). Also includes an `href` property that includes any existing `base`.

**Signature:**

```typescript
resolve(to: RouteLocationRaw): RouteLocation & {
        href: string;
    };
```

_Parameters_

| Parameter | Type             | Description                   |
| --------- | ---------------- | ----------------------------- |
| to        | RouteLocationRaw | Raw route location to resolve |

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
linkActiveClass?: string;
```

### linkExactActiveClass

Default class applied to exact active [RouterLink](#router-link-props). If none is provided, `router-link-exact-active` will be applied.

**Signature:**

```typescript
linkExactActiveClass?: string;
```

### parseQuery

Custom implementation to parse a query. See its counterpart, [stringifyQuery](#stringifyquery).

**Signature:**

```typescript
parseQuery?: typeof originalParseQuery;
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
routes: RouteRecordRaw[];
```

### scrollBehavior

Function to control scrolling when navigating between pages. Can return a Promise to delay scrolling. Check .

**Signature:**

```typescript
scrollBehavior?: ScrollBehavior;
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
stringifyQuery?: typeof originalStringifyQuery;
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

- **Type**: [`RouteLocationRaw`](#routelocationraw) (Optional)
- **Details**:

  Where to redirect if the route is directly matched. The redirection happens
  before any navigation guard and triggers a new navigation with the new
  target location.

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

### matched

Array of [normalized route records](#routerecord).

## NavigationFailure

Extended Error that contains extra information regarding a failed navigation.

**Signature:**

```typescript
export interface NavigationFailure extends RouterErrorBase
```

### from

Route location we were navigating from

**Signature:**

```typescript
from: RouteLocationNormalized
```

### to

Route location we were navigating to

**Signature:**

```typescript
to: RouteLocationNormalized
```

### type

Type of the navigation. One of [NavigationFailureType](#navigationfailuretype)

## NavigationGuard

Navigation guard. See [Navigation Guards](/guide/advanced/navigation-guards.md).

**Signature:**

```typescript
export interface NavigationGuard {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>
}
```

### Parameters

| Parameter | Type                                                  | Description                                                                                                                                         |
| --------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| to        | [`RouteLocationNormalized`](#routelocationnormalized) | Route location we are navigating to                                                                                                                 |
| from      | [`RouteLocationNormalized`](#routelocationnormalized) | Route location we are navigating from                                                                                                               |
| next      | [`NavigationGuardNext`](#navigationguardnext)         | Callback to call to accept or reject the navigation. Can also be omitted as long as the navigation guard returns a value instead of calling `next`. |

### Can return

It can return any value that can be passed to `next` as long as it is omitted from the list of arguments.

- `boolean`: Return `true` to accept the navigation or `false` to reject it.
- a [route location](#routelocationraw) to redirect somewhere else.
- `undefined` (or no `return`). Same as returning `true`
