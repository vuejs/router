---
editLink: false
---

<!-- TODO: translation -->

[API 参考](../index.md) / Router

# 接口：Router

路由器实例。

## 属性 %{#Properties}%

### currentRoute %{#Properties-currentRoute}%

• `只读` **currentRoute**: `Ref`<[`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md)\>

当前的 [RouteLocationNormalized](RouteLocationNormalized.md)。

___

### listening %{#Properties-listening}%

• **listening**: `boolean`

允许关闭历史事件的监听器。这是一个为微前端提供的底层 API。

___

### options %{#Properties-options}%

• `只读` **options**: [`RouterOptions`](RouterOptions.md)

创建路由器时的原始选项对象。

## Methods %{#Methods}%

### addRoute %{#Methods-addRoute}%

▸ **addRoute**(`parentName`, `route`): () => `void`

添加一个新的[路由记录](../index.md#routerecordraw)，将其作为一个已有路由的子路由。

#### 参数 %{#Methods-addRoute-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `parentName` | [`RouteRecordName`](../index.md#routerecordname) | `route` 应该被加入到的父级路由记录 |
| `route` | [`RouteRecordRaw`](../index.md#routerecordraw) | 要加入的路由记录 |

#### 返回值 %{#Methods-addRoute-Returns}%

`fn`

▸ (): `void`

添加一个新的[路由记录](../index.md#routerecordraw)，将其作为一个已有路由的子路由。

##### 返回值 %{#Methods-addRoute-Returns-Returns}%

`void`

▸ **addRoute**(`route`): () => `void`

添加一个新的[路由记录](../index.md#routerecordraw)到该路由器中。

#### 参数 %{#Methods-addRoute-Parameters_1}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `route` | [`RouteRecordRaw`](../index.md#routerecordraw) | 要加入的路由记录 |

#### 返回值 %{#Methods-addRoute-Returns_1}%

`fn`

▸ (): `void`

添加一个新的[路由记录](../index.md#routerecordraw)到该路由器中。

##### 返回值 %{#Methods-addRoute-Returns-Returns_1}%

`void`

___

### afterEach %{#Methods-afterEach}%

▸ **afterEach**(`guard`): () => `void`

添加一个导航钩子，它会在每次导航之后被执行。返回一个用来移除该钩子的函数。

**`Example`**

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

#### 参数 %{#Methods-afterEach-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `guard` | [`NavigationHookAfter`](NavigationHookAfter.md) | 要加入的导航钩子 |

#### 返回值 %{#Methods-afterEach-Returns}%

`fn`

▸ (): `void`

添加一个导航钩子，它会在每次导航之后被执行。返回一个用来移除该钩子的函数。

**`Example`**

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

##### 返回值 %{#Methods-afterEach-Returns-Returns}%

`void`

___

### back %{#Methods-back}%

▸ **back**(): `void`

通过调用 `history.back()` 在可能的情况下在历史中后退。相当于 `router.go(-1)`。

#### 返回值 %{#Methods-back-Returns}%

`void`

___

### beforeEach %{#Methods-beforeEach}%

▸ **beforeEach**(`guard`): () => `void`

添加一个导航钩子，它会在每次导航之前被执行。返回一个用来移除该钩子的函数。

#### 参数 %{#Methods-beforeEach-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `guard` | [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> | 要加入的导航钩子 |

#### 返回值 %{#Methods-beforeEach-Returns}%

`fn`

▸ (): `void`

添加一个导航钩子，它会在每次导航之前被执行。返回一个用来移除该钩子的函数。

##### 返回值 %{#Methods-beforeEach-Returns-Returns}%

`void`

___

### beforeResolve %{#Methods-beforeResolve}%

▸ **beforeResolve**(`guard`): () => `void`

添加一个导航守卫，它会在导航将要被解析之前被执行。此时所有组件都已经获取完毕，且其它导航守卫也都已经完成调用。返回一个用来移除该守卫的函数。

**`Example`**

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

#### 参数 %{#Methods-beforeResolve-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `guard` | [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> | navigation guard to add |

#### 返回值 %{#Methods-beforeResolve-Returns}%

`fn`

▸ (): `void`

添加一个导航守卫，它会在导航将要被解析之前被执行。此时所有组件都已经获取完毕，且其它导航守卫也都已经完成调用。返回一个用来移除该守卫的函数。

**`Example`**

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

##### 返回值 %{#Methods-beforeResolve-Returns-Returns}%

`void`

___

### forward %{#Methods-forward}%

▸ **forward**(): `void`

通过调用 `history.forward()` 在可能的情况下在历史中前进。相当于 `router.go(1)`。

#### 返回值 %{#Methods-forward-Returns}%

`void`

___

### getRoutes %{#Methods-getRoutes}%

▸ **getRoutes**(): [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

获得所有[路由记录](../index.md#routerecord)的完整列表。

#### 返回值 %{#Methods-getRoutes-Returns}%

[`RouteRecordNormalized`](RouteRecordNormalized.md)[]

___

### go %{#Methods-go}%

▸ **go**(`delta`): `void`

允许你在历史中前进或后退。相当于 `router.go()`。

#### 参数 %{#Methods-go-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `delta` | `number` | 相对于当前页面你想要移动到的历史中的位置 |

#### 返回值 %{#Methods-go-Returns}%

`void`

___

### hasRoute %{#Methods-hasRoute}%

▸ **hasRoute**(`name`): `boolean`

检查一个给定名称的路由是否存在。

#### 参数 %{#Methods-hasRoute-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `name` | [`RouteRecordName`](../index.md#routerecordname) | 要检查的路由名称 |

#### 返回值 %{#Methods-hasRoute-Returns}%

`boolean`

___

### isReady %{#Methods-isReady}%

▸ **isReady**(): `Promise`<`void`\>

返回一个 Promise，它会在路由器完成初始导航之后被解析，也就是说这时所有和初始路由有关联的异步入口钩子和异步组件都已经被解析。如果初始导航已经发生，则该 Promise 会被立刻解析。

这在服务端渲染中确认服务端和客户端输出一致的时候非常有用。注意在服务端你需要手动加入初始地址，而在客户端，路由器会从 URL 中自动获取。

#### 返回值 %{#Methods-isReady-Returns}%

`Promise`<`void`\>

___

### onError %{#Methods-onError}%

▸ **onError**(`handler`): () => `void`

添加一个错误处理器，它会在每次导航遇到未被捕获的错误出现时被调用。其中包括同步和异步被抛出的错误、在任何导航守卫中返回或传入 `next` 的错误、尝试解析一个需要渲染路由的异步组件时发生的错误。

#### 参数 %{#Methods-onError-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `handler` | `_ErrorHandler` | 要注册的错误处理器 |

#### 返回值 %{#Methods-onError-Returns}%

`fn`

▸ (): `void`

添加一个错误处理器，它会在每次导航遇到未被捕获的错误出现时被调用。其中包括同步和异步被抛出的错误、在任何导航守卫中返回或传入 `next` 的错误、尝试解析一个需要渲染路由的异步组件时发生的错误。

##### 返回值 %{#Methods-onError-Returns-Returns}%

`void`

___

### push %{#Methods-push}%

▸ **push**(`to`): `Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

程序式地通过将一条记录加入到历史栈中来导航到一个新的 URL。

#### 参数 %{#Methods-push-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#routelocationraw) | 要导航到的路由 |

#### 返回值 %{#Methods-push-Returns}%

`Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

___

### removeRoute %{#Methods-removeRoute}%

▸ **removeRoute**(`name`): `void`

根据其名称移除一个现有的路由。

#### 参数 %{#Methods-removeRoute-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `name` | [`RouteRecordName`](../index.md#routerecordname) | 要移除的路由名称 |

#### 返回值 %{#Methods-removeRoute-Returns}%

`void`

___

### replace %{#Methods-replace}%

▸ **replace**(`to`): `Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

程序式地通过替换历史栈中的当前记录来导航到一个新的 URL。

#### 参数 %{#Methods-replace-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#routelocationraw) | 要导航到的路由 |

#### 返回值 %{#Methods-replace-Returns}%

`Promise`<`undefined` \| `void` \| [`NavigationFailure`](NavigationFailure.md)\>

___

### resolve %{#Methods-resolve}%

▸ **resolve**(`to`, `currentLocation?`): [`RouteLocation`](RouteLocation.md) & { `href`: `string`  }

返回一个[路由地址](../index.md#routelocationraw)的[规范化版本](RouteLocation.md)。同时包含一个包含任何现有 `base` 的 `href` 属性。默认情况下，用于 `router.currentRoute` 的 `currentLocation` 应该在特别高阶的用例下才会被覆写。

#### 参数 %{#Methods-resolve-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `to` | [`RouteLocationRaw`](../index.md#routelocationraw) | 要解析的原始路由地址 |
| `currentLocation?` | [`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md) | 可选的被解析的当前地址 |

#### 返回值 %{#Methods-resolve-Returns}%

[`RouteLocation`](RouteLocation.md) & { `href`: `string`  }
