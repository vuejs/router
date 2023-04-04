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

### START\_LOCATION %{#Variables-START_LOCATION}%

• `Const` **START\_LOCATION**: [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

路由器的初始路由位置。可以在导航守卫中使用来区分初始导航。

**示例**

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

#### 参数 %{#Functions-createMemoryHistory-Parameters}%

| 名称 | 类型 | 默认值 | 描述 |
| :------ | :------ | :------ | :------ |
| `base` | `string` | `''` | 所有 URL 的基础位置，默认为 '/' |

#### 返回值 %{#Functions-createMemoryHistory-Returns}%

[`RouterHistory`](interfaces/RouterHistory.md)

一个历史对象，可以传递给路由器构造函数。

___

### createRouter %{#Functions-createRouter}%

▸ **createRouter**(`options`): [`Router`](interfaces/Router.md)

创建一个可以被 Vue 应用使用的 Router 实例。

#### 参数 %{#Functions-createRouter-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `options` | [`RouterOptions`](interfaces/RouterOptions.md) | [RouterOptions](interfaces/RouterOptions.md) |

#### 返回值 %{#Functions-createRouter-Returns}%

[`Router`](interfaces/Router.md)

___

### createWebHashHistory %{#Functions-createWebHashHistory}%

▸ **createWebHashHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

创建一个 hash 模式的历史。在没有主机的 web 应用 (如 `file://`) 或无法通过配置服务器来处理任意 URL 的时候非常有用。

**示例**

```js
// 基于 https://example.com/folder
createWebHashHistory() // 给出一个 `https://example.com/folder#` 的 URL
createWebHashHistory('/folder/') // 给出一个 `https://example.com/folder/#` 的 URL
// 如果其基础位置提供了 `#`，则不会被 `createWebHashHistory` 添加
createWebHashHistory('/folder/#/app/') // 给出一个 `https://example.com/folder/#/app/` 的 URL
// 你应该避免这样做，因为它改变了原始的 URL 且破坏了复制 URL 的工作
createWebHashHistory('/other-folder/') // 给出一个 `https://example.com/other-folder/#` 的 URL

// 基于 file:///usr/etc/folder/index.html
// 对于没有 `host` 的位置，该 base 会被忽略
createWebHashHistory('/iAmIgnored') // 给出一个 `file:///usr/etc/folder/index.html#` 的 URL
```

#### 参数 %{#Functions-createWebHashHistory-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `base?` | `string` | 可选提供的基础位置。默认为 `location.pathname + location.search`。如果在 `head` 中有一个 `<base>` 标签，它的值会因此被忽略，**但注意它会影响所有 history.pushState() 的调用**，这意味着如果你使用一个 `<base>` 标签，它的 `href` 值**必须与这个参数匹配** (忽略 `#` 后的任何东西)。 |

#### 返回值 %{#Functions-createWebHashHistory-Returns}%

[`RouterHistory`](interfaces/RouterHistory.md)

___

### createWebHistory %{#Functions-createWebHistory}%

▸ **createWebHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

创建一个 HTML5 历史。对于单页应用来说这是最常见的历史。

#### 参数 %{#Functions-createWebHistory-Parameters}%

| 名称 | 类型 |
| :------ | :------ |
| `base?` | `string` |

#### 返回值 %{#Functions-createWebHistory-Returns}%

[`RouterHistory`](interfaces/RouterHistory.md)

___

### isNavigationFailure %{#Functions-isNavigationFailure}%

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationRedirectError

检查一个对象是否是 [NavigationFailure](interfaces/NavigationFailure.md)。

**示例**

```js
import { isNavigationFailure, NavigationFailureType } from 'vue-router'

router.afterEach((to, from, failure) => {
  // 任何类型的导航失败
  if (isNavigationFailure(failure)) {
    // ...
  }
  // 重复的导航
  if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    // ...
  }
  // 中止或取消的导航
  if (isNavigationFailure(failure, NavigationFailureType.aborted | NavigationFailureType.canceled)) {
    // ...
  }
})
```

#### 参数 %{#Functions-isNavigationFailure-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `error` | `any` | 可能的 [NavigationFailure](interfaces/NavigationFailure.md) |
| `type?` | `NAVIGATION_GUARD_REDIRECT` | 可选的待检查类型 |

#### 返回值 %{#Functions-isNavigationFailure-Returns}%

error is NavigationRedirectError

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationFailure

#### 参数 %{#Functions-isNavigationFailure-Parameters_1}%

| 名称 | 类型 |
| :------ | :------ |
| `error` | `any` |
| `type?` | `ErrorTypes` \| [`NavigationFailureType`](enums/NavigationFailureType.md) |

#### 返回值 %{#Functions-isNavigationFailure-Returns_1}%

error is NavigationFailure

___

### loadRouteLocation %{#Functions-loadRouteLocation}%

▸ **loadRouteLocation**(`route`): `Promise`<[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)\>

确保路由被加载，所以它可以作为一个 prop 传递给 `<RouterView>`。

#### 参数 %{#Functions-loadRouteLocation-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `route` | [`RouteLocationNormalized`](interfaces/RouteLocationNormalized.md) | 解析要加载的路由 |

#### 返回值 %{#Functions-loadRouteLocation-Returns}%

`Promise`<[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)\>

___

### onBeforeRouteLeave %{#Functions-onBeforeRouteLeave}%

▸ **onBeforeRouteLeave**(`leaveGuard`): `void`

添加一个导航守卫，不论当前位置的组件何时离开都会触发。类似于 beforeRouteLeave，但可以在任意组件中使用。当组件被卸载时，该守卫会被移除。

#### 参数 %{#Functions-onBeforeRouteLeave-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `leaveGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### 返回值 %{#Functions-onBeforeRouteLeave-Returns}%

`void`

___

### onBeforeRouteUpdate %{#Functions-onBeforeRouteUpdate}%

▸ **onBeforeRouteUpdate**(`updateGuard`): `void`

添加一个导航守卫，不论当前位置何时被更新都会触发。类似于 beforeRouteUpdate，但可以在任何组件中使用。当组件被卸载时，该守卫会被移除。

#### 参数 %{#Functions-onBeforeRouteUpdate-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `updateGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### 返回值 %{#Functions-onBeforeRouteUpdate-Returns}%

`void`

___

### useLink %{#Functions-useLink}%

▸ **useLink**(`props`): `Object`

#### 参数 %{#Functions-useLink-Parameters}%

| 名称 | 类型 |
| :------ | :------ |
| `props` | `VueUseOptions`<`RouterLinkOptions`\> |

#### 返回值 %{#Functions-useLink-Returns}%

`Object`

| 名称 | 类型 |
| :------ | :------ |
| `href` | `ComputedRef<string\>` |
| `isActive` | `ComputedRef`<`boolean`\> |
| `isExactActive` | `ComputedRef`<`boolean`\> |
| `navigate` | (`e`: `MouseEvent`) => `Promise`<`void` \| [`NavigationFailure`](interfaces/NavigationFailure.md)\> |
| `route` | `ComputedRef`<[`RouteLocation`](interfaces/RouteLocation.md) & { `href`: `string`  }\> |

___

### useRoute %{#Functions-useRoute}%

▸ **useRoute**(): [`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

返回当前的路由地址。相当于在模板中使用 `$route`。

#### 返回值 %{#Functions-useRoute-Returns}%

[`RouteLocationNormalizedLoaded`](interfaces/RouteLocationNormalizedLoaded.md)

___

### useRouter %{#Functions-useRouter}%

▸ **useRouter**(): [`Router`](interfaces/Router.md)

返回路由器实例。相当于在模板中使用 `$router`。

#### 返回值 %{#Functions-useRouter-Returns}%

[`Router`](interfaces/Router.md)
