---
editLink: false
---

API Documentation

# API Documentation

## Enumerations

- [NavigationFailureType](enums/NavigationFailureType.md)

## Interfaces

- [HistoryState](interfaces/HistoryState.md)
- [NavigationFailure](interfaces/NavigationFailure.md)
- [NavigationGuard](interfaces/NavigationGuard.md)
- [NavigationGuardNext](interfaces/NavigationGuardNext.md)
- [NavigationGuardWithThis](interfaces/NavigationGuardWithThis.md)
- [NavigationHookAfter](interfaces/NavigationHookAfter.md)
- [RouteLocation](interfaces/RouteLocation.md)
- [RouteLocationMatched](interfaces/RouteLocationMatched.md)
- [RouteLocationNormalized](interfaces/RouteLocationNormalized.md)
- [RouteLocationNormalizedLoaded](interfaces/RouteLocationNormalizedLoaded.md)
- [RouteLocationOptions](interfaces/RouteLocationOptions.md)
- [RouteMeta](interfaces/RouteMeta.md)
- [RouteRecordMultipleViews](interfaces/RouteRecordMultipleViews.md)
- [RouteRecordMultipleViewsWithChildren](interfaces/RouteRecordMultipleViewsWithChildren.md)
- [RouteRecordNormalized](interfaces/RouteRecordNormalized.md)
- [RouteRecordRedirect](interfaces/RouteRecordRedirect.md)
- [RouteRecordSingleView](interfaces/RouteRecordSingleView.md)
- [RouteRecordSingleViewWithChildren](interfaces/RouteRecordSingleViewWithChildren.md)
- [Router](interfaces/Router.md)
- [RouterHistory](interfaces/RouterHistory.md)
- [RouterLinkProps](interfaces/RouterLinkProps.md)
- [RouterOptions](interfaces/RouterOptions.md)
- [RouterScrollBehavior](interfaces/RouterScrollBehavior.md)
- [RouterViewProps](interfaces/RouterViewProps.md)
- [\_RouteRecordBase](interfaces/RouteRecordBase.md)

## Type Aliases

### LocationQuery

Ƭ **LocationQuery**: `Record`<`string`, `LocationQueryValue` \| `LocationQueryValue`[]\>

Normalized query object that appears in [RouteLocationNormalized](interfaces/RouteLocationNormalized.md)

___

### LocationQueryRaw

Ƭ **LocationQueryRaw**: `Record`<`string` \| `number`, `LocationQueryValueRaw` \| `LocationQueryValueRaw`[]\>

Loose [LocationQuery](index.md#LocationQuery) object that can be passed to functions like
[push](interfaces/Router.md#push) and [replace](interfaces/Router.md#replace) or anywhere when creating a
[RouteLocationRaw](index.md#RouteLocationRaw)

___

### PathParserOptions

Ƭ **PathParserOptions**: `Pick`<`_PathParserOptions`, ``"end"`` \| ``"sensitive"`` \| ``"strict"``\>

___

### RouteComponent

Ƭ **RouteComponent**: `Component` \| `DefineComponent`

Allowed Component in [RouteLocationMatched](interfaces/RouteLocationMatched.md)

___

### RouteLocationRaw

Ƭ **RouteLocationRaw**: `string` \| `RouteLocationPathRaw` \| `RouteLocationNamedRaw`

User-level route location

___

### RouteParams

Ƭ **RouteParams**: `Record`<`string`, `RouteParamValue` \| `RouteParamValue`[]\>

___

### RouteParamsRaw

Ƭ **RouteParamsRaw**: `Record`<`string`, `RouteParamValueRaw` \| `Exclude`<`RouteParamValueRaw`, ``null`` \| `undefined`\>[]\>

___

### RouteRecord

Ƭ **RouteRecord**: [`RouteRecordNormalized`](interfaces/RouteRecordNormalized.md)

Normalized version of a [route record](index.md#RouteRecord).

___

### RouteRecordName

Ƭ **RouteRecordName**: `string` \| `symbol`

Possible values for a user-defined route record's name

___

### RouteRecordRaw

Ƭ **RouteRecordRaw**: [`RouteRecordSingleView`](interfaces/RouteRecordSingleView.md) \| [`RouteRecordSingleViewWithChildren`](interfaces/RouteRecordSingleViewWithChildren.md) \| [`RouteRecordMultipleViews`](interfaces/RouteRecordMultipleViews.md) \| [`RouteRecordMultipleViewsWithChildren`](interfaces/RouteRecordMultipleViewsWithChildren.md) \| [`RouteRecordRedirect`](interfaces/RouteRecordRedirect.md)

___

### UseLinkOptions

Ƭ **UseLinkOptions**: `VueUseOptions`<`RouterLinkOptions`\>

## Variables

### RouterLink

• `Const` **RouterLink**: `_RouterLinkI`

Component to render a link that triggers a navigation on click.

___

### RouterView

• `Const` **RouterView**: () => { `$props`: `AllowedComponentProps` & `ComponentCustomProps` & `VNodeProps` & [`RouterViewProps`](interfaces/RouterViewProps.md) ; `$slots`: { `default?`: (`__namedParameters`: { `Component`: `VNode`<`RendererNode`, `RendererElement`, { `[key: string]`: `any`;  }\> ; `route`: [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)  }) => `VNode`<`RendererNode`, `RendererElement`, { `[key: string]`: `any`;  }\>[]  }  }

#### Type declaration

• **new RouterView**()

Component to display the current route the user is at.

___

### START\_LOCATION

• `Const` **START\_LOCATION**: [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

Initial route location where the router is. Can be used in navigation guards
to differentiate the initial navigation.

**`Example`**

```js
import { START_LOCATION } from 'vue-router'

router.beforeEach((to, from) => {
  if (from === START_LOCATION) {
    // initial navigation
  }
})
```

## Functions

### createMemoryHistory

▸ **createMemoryHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

Creates an in-memory based history. The main purpose of this history is to handle SSR. It starts in a special location that is nowhere.
It's up to the user to replace that location with the starter location by either calling `router.push` or `router.replace`.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `base` | `string` | `''` | Base applied to all urls, defaults to '/' |

#### Returns

[`RouterHistory`](interfaces/RouterHistory.md)

a history object that can be passed to the router constructor

___

### createRouter

▸ **createRouter**(`options`): [`Router`](interfaces/Router.md)

Creates a Router instance that can be used by a Vue app.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`RouterOptions`](interfaces/RouterOptions.md) | [RouterOptions](interfaces/RouterOptions.md) |

#### Returns

[`Router`](interfaces/Router.md)

___

### createWebHashHistory

▸ **createWebHashHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

Creates a hash history. Useful for web applications with no host (e.g. `file://`) or when configuring a server to
handle any URL is not possible.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `base?` | `string` | optional base to provide. Defaults to `location.pathname + location.search` If there is a `<base>` tag in the `head`, its value will be ignored in favor of this parameter **but note it affects all the history.pushState() calls**, meaning that if you use a `<base>` tag, it's `href` value **has to match this parameter** (ignoring anything after the `#`). |

#### Returns

[`RouterHistory`](interfaces/RouterHistory.md)

**`Example`**

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

___

### createWebHistory

▸ **createWebHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

Creates an HTML5 history. Most common history for single page applications.

#### Parameters

| Name | Type |
| :------ | :------ |
| `base?` | `string` |

#### Returns

[`RouterHistory`](interfaces/RouterHistory.md)

___

### isNavigationFailure

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationRedirectError

Check if an object is a [NavigationFailure](interfaces/NavigationFailure.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `any` | possible [NavigationFailure](interfaces/NavigationFailure.md) |
| `type?` | `NAVIGATION_GUARD_REDIRECT` | optional types to check for |

#### Returns

error is NavigationRedirectError

**`Example`**

```js
import { isNavigationFailure, NavigationFailureType } from 'vue-router'

router.afterEach((to, from, failure) => {
  // Any kind of navigation failure
  if (isNavigationFailure(failure)) {
    // ...
  }
  // Only duplicated navigations
  if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    // ...
  }
  // Aborted or canceled navigations
  if (isNavigationFailure(failure, NavigationFailureType.aborted | NavigationFailureType.canceled)) {
    // ...
  }
})
```

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationFailure

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `any` |
| `type?` | `ErrorTypes` \| [`NavigationFailureType`](enums/NavigationFailureType.md) |

#### Returns

error is NavigationFailure

___

### loadRouteLocation

▸ **loadRouteLocation**(`route`): `Promise`<[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)\>

Ensures a route is loaded, so it can be passed as o prop to `<RouterView>`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `route` | [`RouteLocationNormalized`](interfaces/RouteLocationNormalized.md) | resolved route to load |

#### Returns

`Promise`<[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)\>

___

### onBeforeRouteLeave

▸ **onBeforeRouteLeave**(`leaveGuard`): `void`

Add a navigation guard that triggers whenever the component for the current
location is about to be left. Similar to beforeRouteLeave but can be
used in any component. The guard is removed when the component is unmounted.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `leaveGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### Returns

`void`

___

### onBeforeRouteUpdate

▸ **onBeforeRouteUpdate**(`updateGuard`): `void`

Add a navigation guard that triggers whenever the current location is about
to be updated. Similar to beforeRouteUpdate but can be used in any
component. The guard is removed when the component is unmounted.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `updateGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### Returns

`void`

___

### useLink

▸ **useLink**(`props`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `VueUseOptions`<`RouterLinkOptions`\> |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `href` | `ComputedRef`<`string`\> |
| `isActive` | `ComputedRef`<`boolean`\> |
| `isExactActive` | `ComputedRef`<`boolean`\> |
| `navigate` | (`e`: `MouseEvent`) => `Promise`<`void` \| [`NavigationFailure`](interfaces/NavigationFailure.md)\> |
| `route` | `ComputedRef`<[`RouteLocation`](interfaces/RouteLocation.md) & { `href`: `string`  }\> |

___

### useRoute

▸ **useRoute**(): [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

Returns the current route location. Equivalent to using `$route` inside
templates.

#### Returns

[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

___

### useRouter

▸ **useRouter**(): [`Router`](interfaces/Router.md)

Returns the router instance. Equivalent to using `$router` inside
templates.

#### Returns

[`Router`](interfaces/Router.md)
