---
editLink: false
---

[API Documentation](../index.md) / Router

# Interface: Router

Router instance.

## Properties

### currentRoute

• `Readonly` **currentRoute**: `Ref`<[`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md)\>

Current [RouteLocationNormalized](RouteLocationNormalized.md)

___

### listening

• **listening**: `boolean`

Allows turning off the listening of history events. This is a low level api for micro-frontends.

___

### options

• `Readonly` **options**: [`RouterOptions`](RouterOptions.md)

Original options object passed to create the Router

## Methods

### addRoute

▸ **addRoute**(`parentName`, `route`): () => `void`

Add a new [route record](../index.md#RouteRecordRaw) as the child of an existing route.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `parentName` | [`RouteRecordName`](../index.md#RouteRecordName) | Parent Route Record where `route` should be appended at |
| `route` | [`RouteRecordRaw`](../index.md#RouteRecordRaw) | Route Record to add |

#### Returns

`fn`

▸ (): `void`

Add a new [route record](../index.md#RouteRecordRaw) as the child of an existing route.

##### Returns

`void`

▸ **addRoute**(`route`): () => `void`

Add a new [route record](../index.md#RouteRecordRaw) to the router.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `route` | [`RouteRecordRaw`](../index.md#RouteRecordRaw) | Route Record to add |

#### Returns

`fn`

▸ (): `void`

Add a new [route record](../index.md#RouteRecordRaw) to the router.

##### Returns

`void`

___

### afterEach

▸ **afterEach**(`guard`): () => `void`

Add a navigation hook that is executed after every navigation. Returns a
function that removes the registered hook.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `guard` | [`NavigationHookAfter`](NavigationHookAfter.md) | navigation hook to add |

#### Returns

`fn`

a function that removes the registered hook

▸ (): `void`

Add a navigation hook that is executed after every navigation. Returns a
function that removes the registered hook.

##### Returns

`void`

a function that removes the registered hook

**`Example`**

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

**`Example`**

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

___

### back

▸ **back**(): `void`

Go back in history if possible by calling `history.back()`. Equivalent to
`router.go(-1)`.

#### Returns

`void`

___

### beforeEach

▸ **beforeEach**(`guard`): () => `void`

Add a navigation guard that executes before any navigation. Returns a
function that removes the registered guard.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `guard` | [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> | navigation guard to add |

#### Returns

`fn`

▸ (): `void`

Add a navigation guard that executes before any navigation. Returns a
function that removes the registered guard.

##### Returns

`void`

___

### beforeResolve

▸ **beforeResolve**(`guard`): () => `void`

Add a navigation guard that executes before navigation is about to be
resolved. At this state all component have been fetched and other
navigation guards have been successful. Returns a function that removes the
registered guard.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `guard` | [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> | navigation guard to add |

#### Returns

`fn`

a function that removes the registered guard

▸ (): `void`

Add a navigation guard that executes before navigation is about to be
resolved. At this state all component have been fetched and other
navigation guards have been successful. Returns a function that removes the
registered guard.

##### Returns

`void`

a function that removes the registered guard

**`Example`**

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

**`Example`**

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

___

### forward

▸ **forward**(): `void`

Go forward in history if possible by calling `history.forward()`.
Equivalent to `router.go(1)`.

#### Returns

`void`

___

### getRoutes

▸ **getRoutes**(): [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

Get a full list of all the [route records](../index.md#RouteRecord).

#### Returns

[`RouteRecordNormalized`](RouteRecordNormalized.md)[]

___

### go

▸ **go**(`delta`): `void`

Allows you to move forward or backward through the history. Calls
`history.go()`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delta` | `number` | The position in the history to which you want to move, relative to the current page |

#### Returns

`void`

___

### hasRoute

▸ **hasRoute**(`name`): `boolean`

Checks if a route with a given name exists

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | [`RouteRecordName`](../index.md#RouteRecordName) | Name of the route to check |

#### Returns

`boolean`

___

### isReady

▸ **isReady**(): `Promise`<`void`\>

Returns a Promise that resolves when the router has completed the initial
navigation, which means it has resolved all async enter hooks and async
components that are associated with the initial route. If the initial
navigation already happened, the promise resolves immediately.

This is useful in server-side rendering to ensure consistent output on both
the server and the client. Note that on server side, you need to manually
push the initial location while on client side, the router automatically
picks it up from the URL.

#### Returns

`Promise`<`void`\>

___

### onError

▸ **onError**(`handler`): () => `void`

Adds an error handler that is called every time a non caught error happens
during navigation. This includes errors thrown synchronously and
asynchronously, errors returned or passed to `next` in any navigation
guard, and errors occurred when trying to resolve an async component that
is required to render a route.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | `_ErrorListener` | error handler to register |

#### Returns

`fn`

▸ (): `void`

Adds an error handler that is called every time a non caught error happens
during navigation. This includes errors thrown synchronously and
asynchronously, errors returned or passed to `next` in any navigation
guard, and errors occurred when trying to resolve an async component that
is required to render a route.

##### Returns

`void`

___

### push

▸ **push**(`to`): `Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

Programmatically navigate to a new URL by pushing an entry in the history
stack.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#RouteLocationRaw) | Route location to navigate to |

#### Returns

`Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

___

### removeRoute

▸ **removeRoute**(`name`): `void`

Remove an existing route by its name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | [`RouteRecordName`](../index.md#RouteRecordName) | Name of the route to remove |

#### Returns

`void`

___

### replace

▸ **replace**(`to`): `Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

Programmatically navigate to a new URL by replacing the current entry in
the history stack.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#RouteLocationRaw) | Route location to navigate to |

#### Returns

`Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

___

### resolve

▸ **resolve**(`to`, `currentLocation?`): [`RouteLocation`](RouteLocation.md) & { `href`: `string`  }

Returns the [normalized version](RouteLocation.md) of a
[route location](../index.md#RouteLocationRaw). Also includes an `href` property
that includes any existing `base`. By default, the `currentLocation` used is
`router.currentRoute` and should only be overridden in advanced use cases.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#RouteLocationRaw) | Raw route location to resolve |
| `currentLocation?` | [`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md) | Optional current location to resolve against |

#### Returns

[`RouteLocation`](RouteLocation.md) & { `href`: `string`  }
