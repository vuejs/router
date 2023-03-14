API 文档

# API 文档

## TS 枚举 %{#Enumerations}%

- [NavigationFailureType](enums/NavigationFailureType.md)

## TS 接口 %{#Interfaces}%

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
- [RouteRecordNormalized](interfaces/RouteRecordNormalized.md)
- [Router](interfaces/Router.md)
- [RouterHistory](interfaces/RouterHistory.md)
- [RouterLinkProps](interfaces/RouterLinkProps.md)
- [RouterOptions](interfaces/RouterOptions.md)
- [RouterScrollBehavior](interfaces/RouterScrollBehavior.md)
- [RouterViewProps](interfaces/RouterViewProps.md)

## TS 类型别名 %{#Type-Aliases}%

### LocationQuery %{#Type-Aliases-LocationQuery}%

Ƭ **LocationQuery**: `Record`<`string`, `LocationQueryValue` \| `LocationQueryValue`[]\>

出现在 [RouteLocationNormalized](interfaces/RouteLocationNormalized.md) 中的规范化查询对象。

___

### LocationQueryRaw %{#Type-Aliases-LocationQueryRaw}%

Ƭ **LocationQueryRaw**: `Record`<`string` \| `number`, `LocationQueryValueRaw` \| `LocationQueryValueRaw`[]\>

松散的 [LocationQuery](index.md#locationquery) 对象，可以被传递给诸如
[push](interfaces/Router.md#push)、[replace](interfaces/Router.md#replace) 或任何创建
[RouteLocationRaw](index.md#routelocationraw) 的函数。

___

### PathParserOptions %{#Type-Aliases-PathParserOptions}%

Ƭ **PathParserOptions**: `Pick`<`_PathParserOptions`, ``"end"`` \| ``"sensitive"`` \| ``"strict"``\>

___

### RouteComponent %{#Type-Aliases-RouteComponent}%

Ƭ **RouteComponent**: `Component` \| `DefineComponent`

在 [RouteLocationMatched](interfaces/RouteLocationMatched.md) 中允许的组件。

___

### RouteLocationRaw %{#Type-Aliases-RouteLocationRaw}%

Ƭ **RouteLocationRaw**: `string` \| `RouteLocationPathRaw` \| `RouteLocationNamedRaw`

用户级别的路由位置。

___

### RouteParams %{#Type-Aliases-RouteParams}%

Ƭ **RouteParams**: `Record`<`string`, `RouteParamValue` \| `RouteParamValue`[]\>

___

### RouteParamsRaw %{#Type-Aliases-RouteParamsRaw}%

Ƭ **RouteParamsRaw**: `Record`<`string`, `RouteParamValueRaw` \| `Exclude`<`RouteParamValueRaw`, ``null`` \| `undefined`\>[]\>

___

### RouteRecord %{#Type-Aliases-RouteRecord}%

Ƭ **RouteRecord**: [`RouteRecordNormalized`](interfaces/RouteRecordNormalized.md)

一个[路由记录](index.md#routerecord)的规范化版本。

___

### RouteRecordName %{#Type-Aliases-RouteRecordName}%

Ƭ **RouteRecordName**: `string` \| `symbol`

用户定义的路由记录的可能的名称。

___

### RouteRecordRaw %{#Type-Aliases-RouteRecordRaw}%

Ƭ **RouteRecordRaw**: `RouteRecordSingleView` \| `RouteRecordSingleViewWithChildren` \| `RouteRecordMultipleViews` \| `RouteRecordMultipleViewsWithChildren` \| `RouteRecordRedirect`

___

### UseLinkOptions %{#Type-Aliases-UseLinkOptions}%

Ƭ **UseLinkOptions**: `VueUseOptions`<`RouterLinkOptions`\>

## 变量 %{#Variables}%

### RouterLink %{#Variables-RouterLink}%

• `Const` **RouterLink**: `_RouterLinkI`

用来渲染一个链接的组件，该链接在被点击时会触发导航。

___

### RouterView %{#Variables-RouterView}%

• `Const` **RouterView**: () => { `$props`: `AllowedComponentProps` & `ComponentCustomProps` & `VNodeProps` & [`RouterViewProps`](interfaces/RouterViewProps.md) ; `$slots`: { `default?`: (`__namedParameters`: { `Component`: `VNode`<`RendererNode`, `RendererElement`, { `[key: string]`: `any`;  }\> ; `route`: [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)  }) => `VNode`<`RendererNode`, `RendererElement`, { `[key: string]`: `any`;  }\>[]  }  }

#### 类型声明 %{#Variables-RouterView-Type-declaration}%

• **new RouterView**()

用于显示用户当前所处路由的组件。

___

### START\_LOCATION %{#Variables-START\_LOCATION}%

• `Const` **START\_LOCATION**: [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

路由器的初始路由位置。可以在导航守卫中使用来区分初始导航。

**`Example`**

```js
import { START_LOCATION } from 'vue-router'

router.beforeEach((to, from) => {
  if (from === START_LOCATION) {
    // 初始导航
  }
})
```

## 函数 %{#Functions}%

### createMemoryHistory %{#Functions-createMemoryHistory}%

▸ **createMemoryHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

创建一个基于内存的历史。该历史的主要目的是为了处理服务端渲染。它从一个不存在的特殊位置开始。用户可以通过调用 `router.push` 或 `router.replace` 将该位置替换成起始位置。

#### Parameters %{#Functions-createMemoryHistory-Parameters}%

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `base` | `string` | `''` | 所有 URL 的基础位置，默认为 '/' |

#### Returns %{#Functions-createMemoryHistory-Returns}%

[`RouterHistory`](interfaces/RouterHistory.md)

一个历史对象，可以传递给路由器构造函数。

___

### createRouter %{#Functions-createRouter}%

▸ **createRouter**(`options`): [`Router`](interfaces/Router.md)

创建一个可以被 Vue 应用使用的 Router 实例。

#### Parameters %{#Functions-createRouter-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`RouterOptions`](interfaces/RouterOptions.md) | [RouterOptions](interfaces/RouterOptions.md) |

#### Returns %{#Functions-createRouter-Returns}%

[`Router`](interfaces/Router.md)

___

### createWebHashHistory %{#Functions-createWebHashHistory}%

▸ **createWebHashHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

创建一个 hash 模式的历史。在没有主机的 web 应用 (如 `file://`) 或无法通过配置服务器来处理任意 URL 的时候非常有用。

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

#### Parameters %{#Functions-createWebHashHistory-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `base?` | `string` | optional base to provide. Defaults to `location.pathname + location.search` If there is a `<base>` tag in the `head`, its value will be ignored in favor of this parameter **but note it affects all the history.pushState() calls**, meaning that if you use a `<base>` tag, it's `href` value **has to match this parameter** (ignoring anything after the `#`). |

#### Returns %{#Functions-createWebHashHistory-Returns}%

[`RouterHistory`](interfaces/RouterHistory.md)

___

### createWebHistory %{#Functions-createWebHistory}%

▸ **createWebHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

Creates an HTML5 history. Most common history for single page applications.

#### Parameters %{#Functions-createWebHistory-Parameters}%

| Name | Type |
| :------ | :------ |
| `base?` | `string` |

#### Returns %{#Functions-createWebHistory-Returns}%

[`RouterHistory`](interfaces/RouterHistory.md)

___

### isNavigationFailure %{#Functions-isNavigationFailure}%

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationRedirectError

Check if an object is a [NavigationFailure](interfaces/NavigationFailure.md).

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

#### Parameters %{#Functions-isNavigationFailure-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `any` | possible [NavigationFailure](interfaces/NavigationFailure.md) |
| `type?` | `NAVIGATION_GUARD_REDIRECT` | optional types to check for |

#### Returns %{#Functions-isNavigationFailure-Returns}%

error is NavigationRedirectError

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationFailure

#### Parameters %{#Functions-isNavigationFailure-Parameters_1}%

| Name | Type |
| :------ | :------ |
| `error` | `any` |
| `type?` | `ErrorTypes` \| [`NavigationFailureType`](enums/NavigationFailureType.md) |

#### Returns %{#Functions-isNavigationFailure-Returns_1}%

error is NavigationFailure

___

### loadRouteLocation %{#Functions-loadRouteLocation}%

▸ **loadRouteLocation**(`route`): `Promise`<[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)\>

Ensures a route is loaded, so it can be passed as o prop to `<RouterView>`.

#### Parameters %{#Functions-loadRouteLocation-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `route` | [`RouteLocationNormalized`](interfaces/RouteLocationNormalized.md) | resolved route to load |

#### Returns %{#Functions-loadRouteLocation-Returns}%

`Promise`<[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)\>

___

### onBeforeRouteLeave %{#Functions-onBeforeRouteLeave}%

▸ **onBeforeRouteLeave**(`leaveGuard`): `void`

Add a navigation guard that triggers whenever the component for the current
location is about to be left. Similar to beforeRouteLeave but can be
used in any component. The guard is removed when the component is unmounted.

#### Parameters %{#Functions-onBeforeRouteLeave-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `leaveGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### Returns %{#Functions-onBeforeRouteLeave-Returns}%

`void`

___

### onBeforeRouteUpdate %{#Functions-onBeforeRouteUpdate}%

▸ **onBeforeRouteUpdate**(`updateGuard`): `void`

Add a navigation guard that triggers whenever the current location is about
to be updated. Similar to beforeRouteUpdate but can be used in any
component. The guard is removed when the component is unmounted.

#### Parameters %{#Functions-onBeforeRouteUpdate-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `updateGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### Returns %{#Functions-onBeforeRouteUpdate-Returns}%

`void`

___

### useLink %{#Functions-useLink}%

▸ **useLink**(`props`): `Object`

#### Parameters %{#Functions-useLink-Parameters}%

| Name | Type |
| :------ | :------ |
| `props` | `VueUseOptions`<`RouterLinkOptions`\> |

#### Returns %{#Functions-useLink-Returns}%

`Object`

| Name | Type |
| :------ | :------ |
| `href` | `ComputedRef`<`string`\> |
| `isActive` | `ComputedRef`<`boolean`\> |
| `isExactActive` | `ComputedRef`<`boolean`\> |
| `navigate` | (`e`: `MouseEvent`) => `Promise`<`void` \| [`NavigationFailure`](interfaces/NavigationFailure.md)\> |
| `route` | `ComputedRef`<[`RouteLocation`](interfaces/RouteLocation.md) & { `href`: `string`  }\> |

___

### useRoute %{#Functions-useRoute}%

▸ **useRoute**(): [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

Returns the current route location. Equivalent to using `$route` inside
templates.

#### Returns %{#Functions-useRoute-Returns}%

[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

___

### useRouter %{#Functions-useRouter}%

▸ **useRouter**(): [`Router`](interfaces/Router.md)

Returns the router instance. Equivalent to using `$router` inside
templates.

#### Returns %{#Functions-useRouter-Returns}%

[`Router`](interfaces/Router.md)
