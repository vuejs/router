---
editLink: false
---

[API 参考](../index.md) / RouteRecordNormalized

# 接口：RouteRecordNormalized

一条[路由记录](../index.md#routerecord)的规范化版本。

## 继承关系 %{#Hierarchy}%

- **`RouteRecordNormalized`**

  ↳ [`RouteLocationMatched`](RouteLocationMatched.md)

## 属性 %{#Properties}%

### aliasOf %{#Properties-aliasOf}%

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

定义了是否这条记录是另一条的别名。如果记录是原始记录，则该属性为 `undefined`。

___

### beforeEnter %{#Properties-beforeEnter}%

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)\<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)\<`undefined`\>[]

被注册的 beforeEnter 守卫

___

### children %{#Properties-children}%

• **children**: [`RouteRecordRaw`](../index.md#routerecordraw)[]

嵌套的路由记录。

___

### components %{#Properties-components}%

• **components**: `undefined` \| ``null`` \| `Record`\<`string`, `RawRouteComponent`\>

当 URL 匹配到该路由时显示的组件。允许使用命名视图。

___

### instances %{#Properties-instances}%

• **instances**: `Record`\<`string`, `undefined` \| ``null`` \| `ComponentPublicInstance`\>

挂载的路由组件实例。
在记录上存在实例意味着，当有多个应用实例渲染相同的视图时，beforeRouteUpdate 和 beforeRouteLeave 守卫只能被最后挂载的应用实例调用。这样的渲染基本上只会对页面内容进行复制，在实际情况下并不应该发生。它可以在多个应用渲染不同的命名视图时工作。

___

### meta %{#Properties-meta}%

• **meta**: [`RouteMeta`](RouteMeta.md)

附加在记录上的任意数据。

___

### name %{#Properties-name}%

• **name**: `undefined` \| [`RouteRecordName`](../index.md#routerecordname)

路由记录的名称。必须唯一。

___

### path %{#Properties-path}%

• **path**: `string`

记录的路径。应该以 `/` 开头，除非该记录为另一条记录的子记录。

___

### props %{#Properties-props}%

• **props**: `Record`\<`string`, `_RouteRecordProps`\>

允许将参数作为 props 传递给由 `router-view` 渲染的组件。应是一个具有与 `components` 相同键的对象，或是一个应用于所有组件的布尔值。

___

### redirect %{#Properties-redirect}%

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

路由直接匹配时重定向的位置。重定向发生在任何导航守卫和带有新目标位置的新导航触发之前。
