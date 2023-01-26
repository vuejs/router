---
editLink: false
---

[API Documentation](../index.md) / Router

# Interface: Router

Router instance.

## Properties %{#Properties}%

### currentRoute %{#Properties-currentRoute}%

• `Readonly` **currentRoute**: `Ref`<[`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md)\>

Current [RouteLocationNormalized](RouteLocationNormalized.md)

___

### listening %{#Properties-listening}%

• **listening**: `boolean`

Allows turning off the listening of history events. This is a low level api for micro-frontends.

___

### options %{#Properties-options}%

• `Readonly` **options**: [`RouterOptions`](RouterOptions.md)

Original options object passed to create the Router

## Methods %{#Methods}%

### addRoute %{#Methods-addRoute}%

▸ **addRoute**(`parentName`, `route`): () => `void`

Add a new [route record](../index.md#routerecordraw) as the child of an existing route.

#### Parameters %{#Methods-addRoute-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `parentName` | [`RouteRecordName`](../index.md#routerecordname) | Parent Route Record where `route` should be appended at |
| `route` | [`RouteRecordRaw`](../index.md#routerecordraw) | Route Record to add |

#### Returns %{#Methods-addRoute-Returns}%

`fn`

▸ (): `void`

Add a new [route record](../index.md#routerecordraw) as the child of an existing route.

##### Returns %{#Methods-addRoute-Returns-Returns}%

`void`

▸ **addRoute**(`route`): () => `void`

Add a new [route record](../index.md#routerecordraw) to the router.

#### Parameters %{#Methods-addRoute-Parameters_1}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `route` | [`RouteRecordRaw`](../index.md#routerecordraw) | Route Record to add |

#### Returns %{#Methods-addRoute-Returns_1}%

`fn`

▸ (): `void`

Add a new [route record](../index.md#routerecordraw) to the router.

##### Returns %{#Methods-addRoute-Returns-Returns_1}%

`void`

___

### afterEach %{#Methods-afterEach}%

▸ **afterEach**(`guard`): () => `void`

Add a navigation hook that is executed after every navigation. Returns a
function that removes the registered hook.

**`Example`**

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

#### Parameters %{#Methods-afterEach-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `guard` | [`NavigationHookAfter`](NavigationHookAfter.md) | navigation hook to add |

#### Returns %{#Methods-afterEach-Returns}%

`fn`

▸ (): `void`

Add a navigation hook that is executed after every navigation. Returns a
function that removes the registered hook.

**`Example`**

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

##### Returns %{#Methods-afterEach-Returns-Returns}%

`void`

___

### back %{#Methods-back}%

▸ **back**(): `void`

Go back in history if possible by calling `history.back()`. Equivalent to
`router.go(-1)`.

#### Returns %{#Methods-back-Returns}%

`void`

___

### beforeEach %{#Methods-beforeEach}%

▸ **beforeEach**(`guard`): () => `void`

Add a navigation guard that executes before any navigation. Returns a
function that removes the registered guard.

#### Parameters %{#Methods-beforeEach-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `guard` | [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> | navigation guard to add |

#### Returns %{#Methods-beforeEach-Returns}%

`fn`

▸ (): `void`

Add a navigation guard that executes before any navigation. Returns a
function that removes the registered guard.

##### Returns %{#Methods-beforeEach-Returns-Returns}%

`void`

___

### beforeResolve %{#Methods-beforeResolve}%

▸ **beforeResolve**(`guard`): () => `void`

Add a navigation guard that executes before navigation is about to be
resolved. At this state all component have been fetched and other
navigation guards have been successful. Returns a function that removes the
registered guard.

**`Example`**

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

#### Parameters %{#Methods-beforeResolve-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `guard` | [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> | navigation guard to add |

#### Returns %{#Methods-beforeResolve-Returns}%

`fn`

▸ (): `void`

Add a navigation guard that executes before navigation is about to be
resolved. At this state all component have been fetched and other
navigation guards have been successful. Returns a function that removes the
registered guard.

**`Example`**

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

##### Returns %{#Methods-beforeResolve-Returns-Returns}%

`void`

___

### forward %{#Methods-forward}%

▸ **forward**(): `void`

Go forward in history if possible by calling `history.forward()`.
Equivalent to `router.go(1)`.

#### Returns %{#Methods-forward-Returns}%

`void`

___

### getRoutes %{#Methods-getRoutes}%

▸ **getRoutes**(): [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

Get a full list of all the [route records](../index.md#routerecord).

#### Returns %{#Methods-getRoutes-Returns}%

[`RouteRecordNormalized`](RouteRecordNormalized.md)[]

___

### go %{#Methods-go}%

▸ **go**(`delta`): `void`

Allows you to move forward or backward through the history. Calls
`history.go()`.

#### Parameters %{#Methods-go-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `delta` | `number` | The position in the history to which you want to move, relative to the current page |

#### Returns %{#Methods-go-Returns}%

`void`

___

### hasRoute %{#Methods-hasRoute}%

▸ **hasRoute**(`name`): `boolean`

Checks if a route with a given name exists

#### Parameters %{#Methods-hasRoute-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | [`RouteRecordName`](../index.md#routerecordname) | Name of the route to check |

#### Returns %{#Methods-hasRoute-Returns}%

`boolean`

___

### isReady %{#Methods-isReady}%

▸ **isReady**(): `Promise`<`void`\>

Returns a Promise that resolves when the router has completed the initial
navigation, which means it has resolved all async enter hooks and async
components that are associated with the initial route. If the initial
navigation already happened, the promise resolves immediately.

This is useful in server-side rendering to ensure consistent output on both
the server and the client. Note that on server side, you need to manually
push the initial location while on client side, the router automatically
picks it up from the URL.

#### Returns %{#Methods-isReady-Returns}%

`Promise`<`void`\>

___

### onError %{#Methods-onError}%

▸ **onError**(`handler`): () => `void`

Adds an error handler that is called every time a non caught error happens
during navigation. This includes errors thrown synchronously and
asynchronously, errors returned or passed to `next` in any navigation
guard, and errors occurred when trying to resolve an async component that
is required to render a route.

#### Parameters %{#Methods-onError-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | `_ErrorHandler` | error handler to register |

#### Returns %{#Methods-onError-Returns}%

`fn`

▸ (): `void`

Adds an error handler that is called every time a non caught error happens
during navigation. This includes errors thrown synchronously and
asynchronously, errors returned or passed to `next` in any navigation
guard, and errors occurred when trying to resolve an async component that
is required to render a route.

##### Returns %{#Methods-onError-Returns-Returns}%

`void`

___

### push %{#Methods-push}%

▸ **push**(`to`): `Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

Programmatically navigate to a new URL by pushing an entry in the history
stack.

#### Parameters %{#Methods-push-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#routelocationraw) | Route location to navigate to |

#### Returns %{#Methods-push-Returns}%

`Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

___

### removeRoute %{#Methods-removeRoute}%

▸ **removeRoute**(`name`): `void`

Remove an existing route by its name.

#### Parameters %{#Methods-removeRoute-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | [`RouteRecordName`](../index.md#routerecordname) | Name of the route to remove |

#### Returns %{#Methods-removeRoute-Returns}%

`void`

___

### replace %{#Methods-replace}%

▸ **replace**(`to`): `Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

Programmatically navigate to a new URL by replacing the current entry in
the history stack.

#### Parameters %{#Methods-replace-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#routelocationraw) | Route location to navigate to |

#### Returns %{#Methods-replace-Returns}%

`Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

___

### resolve %{#Methods-resolve}%

▸ **resolve**(`to`, `currentLocation?`): [`RouteLocation`](RouteLocation.md) & { `href`: `string`  }

Returns the [normalized version](RouteLocation.md) of a
[route location](../index.md#routelocationraw). Also includes an `href` property
that includes any existing `base`. By default, the `currentLocation` used is
`router.currentRoute` and should only be overridden in advanced use cases.

#### Parameters %{#Methods-resolve-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#routelocationraw) | Raw route location to resolve |
| `currentLocation?` | [`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md) | Optional current location to resolve against |

#### Returns %{#Methods-resolve-Returns}%

[`RouteLocation`](RouteLocation.md) & { `href`: `string`  }
