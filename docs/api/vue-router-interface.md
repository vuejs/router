# Interface

## NavigationFailure

Extended Error that contains extra information regarding a failed navigation.

**Signature:**

```typescript
export interface NavigationFailure extends RouterErrorBase
```

### Methods

### Properties

#### from

Route location we were navigating from

**Signature:**

```typescript
from: RouteLocationNormalized
```

#### to

Route location we were navigating to

**Signature:**

```typescript
to: RouteLocationNormalized
```

#### type

Type of the navigation. One of [NavigationFailureType](./vue-router-enum#navigationfailuretype)

**Signature:**

```typescript
type: ErrorTypes.NAVIGATION_CANCELLED |
  ErrorTypes.NAVIGATION_ABORTED |
  ErrorTypes.NAVIGATION_DUPLICATED
```

## NavigationGuard

Navigation guard. See [Navigation Guards](/guide/advanced/navigation-guards.md).

**Signature:**

```typescript
export interface NavigationGuard
```

### Methods

### Properties

## NavigationGuardNext

### Methods

### Properties

## NavigationHookAfter

### Methods

### Properties

## RouteLocation

[RouteLocationRaw](./vue-router-typealias#routelocationraw) resolved using the matcher

**Signature:**

```typescript
export interface RouteLocation extends _RouteLocationBase
```

### Methods

### Properties

#### matched

Array of [RouteRecord](./vue-router-typealias#routerecord) containing components as they were passed when adding records. It can also contain redirect records. This can't be used directly

**Signature:**

```typescript
matched: RouteRecord[];
```

## RouteLocationMatched

### Methods

### Properties

#### components

## RouteLocationNormalized

Similar to [RouteLocation](./vue-router-interface#routelocation) but its [matched](./vue-router-interface#routelocationnormalized.matched) cannot contain redirect records

**Signature:**

```typescript
export interface RouteLocationNormalized extends _RouteLocationBase
```

### Methods

### Properties

#### matched

Array of [RouteRecordNormalized](./vue-router-interface#routerecordnormalized)

**Signature:**

```typescript
matched: RouteRecordNormalized[];
```

## RouteLocationNormalizedLoaded

[RouteLocationRaw](./vue-router-typealias#routelocationraw) with

**Signature:**

```typescript
export interface RouteLocationNormalizedLoaded extends _RouteLocationBase
```

### Methods

### Properties

#### matched

Array of [RouteLocationMatched](./vue-router-interface#routelocationmatched) containing only plain components (any lazy-loaded components have been loaded and were replaced inside of the `components` object) so it can be directly used to display routes. It cannot contain redirect records either

**Signature:**

```typescript
matched: RouteLocationMatched[];
```

## RouteLocationOptions

### Methods

### Properties

#### force

Triggers the navigation even if the location is the same as the current one

**Signature:**

```typescript
force?: boolean;
```

#### replace

Replace the entry in the history instead of pushing a new entry

**Signature:**

```typescript
replace?: boolean;
```

#### state

State to save using the History API. This cannot contain any reactive values and some primitives like Symbols are forbidden. More info at TODO: link mdn

**Signature:**

```typescript
state?: HistoryState;
```

## RouteMeta

### Methods

### Properties

## Router

### Methods

#### addRoute

Add a new [Route Record](./vue-router-typealias#routerecordraw) as the child of an existing route.

**Signature:**

```typescript
addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void;
```

_Parameters_

| Parameter  | Type            | Description                                             |
| ---------- | --------------- | ------------------------------------------------------- |
| parentName | RouteRecordName | Parent Route Record where `route` should be appended at |
| route      | RouteRecordRaw  | Route Record to add                                     |

#### addRoute

Add a new [route record](./vue-router-typealias#routerecordraw) to the router.

**Signature:**

```typescript
addRoute(route: RouteRecordRaw): () => void;
```

_Parameters_

| Parameter | Type           | Description         |
| --------- | -------------- | ------------------- |
| route     | RouteRecordRaw | Route Record to add |

#### afterEach

Add a navigation hook that is executed after every navigation. Returns a function that removes the registered hook.

**Signature:**

```typescript
afterEach(guard: NavigationHookAfter): () => void;
```

_Parameters_

| Parameter | Type                | Description            |
| --------- | ------------------- | ---------------------- |
| guard     | NavigationHookAfter | navigation hook to add |

### Examples

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

#### back

Go back in history if possible by calling `history.back()`. Equivalent to `router.go(-1)`. Returns a Promise. See the limitations at [go](./vue-router-interface#router.go).

**Signature:**

```typescript
back(): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


#### beforeEach

Add a navigation guard that executes before any navigation. Returns a function that removes the registered guard.

**Signature:**

```typescript
beforeEach(guard: NavigationGuardWithThis<undefined>): () => void;
```

_Parameters_

| Parameter | Type                                     | Description             |
| --------- | ---------------------------------------- | ----------------------- |
| guard     | NavigationGuardWithThis&lt;undefined&gt; | navigation guard to add |

#### beforeResolve

Add a navigation guard that executes before navigation is about to be resolved. At this state all component have been fetched and other navigation guards have been successful. Returns a function that removes the registered guard.

**Signature:**

```typescript
beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void;
```

_Parameters_

| Parameter | Type                                     | Description             |
| --------- | ---------------------------------------- | ----------------------- |
| guard     | NavigationGuardWithThis&lt;undefined&gt; | navigation guard to add |

### Examples

```js
router.beforeEach(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

#### forward

Go forward in history if possible by calling `history.forward()`. Equivalent to `router.go(1)`. Returns a Promise. See the limitations at [go](./vue-router-interface#router.go).

**Signature:**

```typescript
forward(): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


#### getRoutes

Get a full list of all the [route records](./vue-router-typealias#routerecord).

**Signature:**

```typescript
getRoutes(): RouteRecord[];
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


#### go

Allows you to move forward or backward through the history. Returns a Promise that resolves when the navigation finishes. If it wasn't possible to go back, the promise never resolves or rejects

**Signature:**

```typescript
go(delta: number): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type   | Description                                                                         |
| --------- | ------ | ----------------------------------------------------------------------------------- |
| delta     | number | The position in the history to which you want to move, relative to the current page |

#### hasRoute

Checks if a route with a given name exists

**Signature:**

```typescript
hasRoute(name: RouteRecordName): boolean;
```

_Parameters_

| Parameter | Type            | Description                |
| --------- | --------------- | -------------------------- |
| name      | RouteRecordName | Name of the route to check |

#### isReady

Returns a Promise that resolves when the router has completed the initial navigation, which means it has resolved all async enter hooks and async components that are associated with the initial route. If the initial navigation already happened, the promise resolves immediately.This is useful in server-side rendering to ensure consistent output on both the server and the client. Note that on server side, you need to manually push the initial location while on client side, the router automatically picks it up from the URL.

**Signature:**

```typescript
isReady(): Promise<void>;
```

_Parameters_

| Parameter | Type | Description |
| --------- | ---- | ----------- |


#### onError

Adds an error handler that is called every time a non caught error happens during navigation. This includes errors thrown synchronously and asynchronously, errors returned or passed to `next` in any navigation guard, and errors occurred when trying to resolve an async component that is required to render a route.

**Signature:**

```typescript
onError(handler: ErrorHandler): () => void;
```

_Parameters_

| Parameter | Type         | Description               |
| --------- | ------------ | ------------------------- |
| handler   | ErrorHandler | error handler to register |

#### push

Programmatically navigate to a new URL by pushing an entry in the history stack.

**Signature:**

```typescript
push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type             | Description                   |
| --------- | ---------------- | ----------------------------- |
| to        | RouteLocationRaw | Route location to navigate to |

#### removeRoute

Remove an existing route by its name.

**Signature:**

```typescript
removeRoute(name: RouteRecordName): void;
```

_Parameters_

| Parameter | Type            | Description                 |
| --------- | --------------- | --------------------------- |
| name      | RouteRecordName | Name of the route to remove |

#### replace

Programmatically navigate to a new URL by replacing the current entry in the history stack.

**Signature:**

```typescript
replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
```

_Parameters_

| Parameter | Type             | Description                   |
| --------- | ---------------- | ----------------------------- |
| to        | RouteLocationRaw | Route location to navigate to |

#### resolve

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

### Properties

#### currentRoute

Current [RouteLocationNormalized](./vue-router-interface#routelocationnormalized)

**Signature:**

```typescript
readonly currentRoute: Ref<RouteLocationNormalizedLoaded>;
```

#### options

Original options object passed to create the Router

**Signature:**

```typescript
readonly options: RouterOptions;
```

## RouteRecordNormalized

Normalized version of a [Route Record](./vue-router-typealias#routerecord)

**Signature:**

```typescript
export interface RouteRecordNormalized
```

### Methods

### Properties

#### aliasOf

Defines if this record is the alias of another one. This property is `undefined` if the record is the original one.

**Signature:**

```typescript
aliasOf: RouteRecordNormalized | undefined
```

#### beforeEnter

**Signature:**

```typescript
beforeEnter: RouteRecordMultipleViews['beforeEnter']
```

#### children

**Signature:**

```typescript
children: Exclude<_RouteRecordBase['children'], void>;
```

#### components

**Signature:**

```typescript
components: RouteRecordMultipleViews['components']
```

#### instances

Mounted route component instances Having the instances on the record mean beforeRouteUpdate and beforeRouteLeave guards can only be invoked with the latest mounted app instance if there are multiple application instances rendering the same view, basically duplicating the content on the page, which shouldn't happen in practice. It will work if multiple apps are rendering different named views.

**Signature:**

```typescript
instances: Record<string, ComponentPublicInstance | undefined | null>;
```

#### meta

Arbitrary data attached to the record.

**Signature:**

```typescript
meta: Exclude<_RouteRecordBase['meta'], void>;
```

#### name

Name for the route record.

**Signature:**

```typescript
name: _RouteRecordBase['name']
```

#### path

Path of the record. Should start with `/` unless the record is the child of another record.

**Signature:**

```typescript
path: _RouteRecordBase['path']
```

#### props

**Signature:**

```typescript
props: Record<string, _RouteRecordProps>;
```

#### redirect

Where to redirect if the route is directly matched. The redirection happens before any navigation guard and triggers a new navigation with the new target location.

**Signature:**

```typescript
redirect: _RouteRecordBase['redirect'] | undefined
```

## RouterOptions

### Methods

### Properties

#### history

History implementation used by the router. Most web applications should use `createWebHistory` but it requires the server to be properly configured. You can also use a _hash_ based history with `createWebHashHistory` that does not require any configuration on the server but isn't handled at all by search engines and does poorly on SEO.

**Signature:**

```typescript
history: RouterHistory
```

### Examples

```js
createRouter({
  history: createWebHistory(),
  // other options...
})
```

#### linkActiveClass

Default class applied to active [RouterLink](./vue-router-variable#routerlink). If none is provided, `router-link-active` will be applied.

**Signature:**

```typescript
linkActiveClass?: string;
```

#### linkExactActiveClass

Default class applied to exact active [RouterLink](./vue-router-variable#routerlink). If none is provided, `router-link-exact-active` will be applied.

**Signature:**

```typescript
linkExactActiveClass?: string;
```

#### parseQuery

Custom implementation to parse a query. See its counterpart, [stringifyQuery](./vue-router-interface#routeroptions.stringifyquery).

**Signature:**

```typescript
parseQuery?: typeof originalParseQuery;
```

### Examples

Let's say you want to use the package [qs](https://github.com/ljharb/qs) to parse queries, you can provide both `parseQuery` and `stringifyQuery`:

```js
import qs from 'qs'

createRouter({
  // other options...
  parse: qs.parse,
  stringifyQuery: qs.stringify,
})
```

#### routes

Initial list of routes that should be added to the router.

**Signature:**

```typescript
routes: RouteRecordRaw[];
```

#### scrollBehavior

Function to control scrolling when navigating between pages. Can return a Promise to delay scrolling. Check .

**Signature:**

```typescript
scrollBehavior?: ScrollBehavior;
```

### Examples

```js
function scrollBehavior(to, from, savedPosition) {
  // `to` and `from` are both route locations
  // `savedPosition` can be null if there isn't one
}
```

#### stringifyQuery

Custom implementation to stringify a query object. Should not prepend a leading `?`. [parseQuery](./vue-router-interface#routeroptions.parsequery) counterpart to handle query parsing.

**Signature:**

```typescript
stringifyQuery?: typeof originalStringifyQuery;
```

## RouterViewProps

### Methods

### Properties

#### name

#### route

## ScrollBehavior_2

### Methods

### Properties
