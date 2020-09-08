---
sidebar: auto
---

# API Reference

- [Components](./vue-router-variable.md)
- [Enumerations](./vue-router-enum.md)
- [Functions](./vue-router-function.md)
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

TODO:

### useRoute

TODO:

### useRouter

TODO:

## TypeScript

Here are some of the interfaces and types used by Vue Router. The documentation references them to give you an idea of the existing properties in objects.
