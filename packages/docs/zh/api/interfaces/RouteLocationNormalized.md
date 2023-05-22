---
editLink: false
---

[API 参考](../index.md) / RouteLocationNormalized

# 接口：RouteLocationNormalized

和 [RouteLocation](RouteLocation.md) 类似但是其 [matched](RouteLocationNormalized.md#matched) 无法包含重定向的记录

## 继承关系 %{#Hierarchy}%

- `_RouteLocationBase`

  ↳ **`RouteLocationNormalized`**

## 属性 %{#Properties}%

### fullPath %{#Properties-fullPath}%

• **fullPath**: `string`

包括 `search` 和 `hash` 在内的完整地址。该字符串是经过百分号编码的。

#### 继承自 %{#Properties-fullPath-Inherited-from}%

\_RouteLocationBase.fullPath

___

### hash %{#Properties-hash}%

• **hash**: `string`

当前地址的 hash。如果存在则以 `#` 开头。

#### 继承自 %{#Properties-hash-Inherited-from}%

\_RouteLocationBase.hash

___

### matched %{#Properties-matched}%

• **matched**: [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

[RouteRecordNormalized](RouteRecordNormalized.md) 数组。

___

### meta %{#Properties-meta}%

• **meta**: [`RouteMeta`](RouteMeta.md)

从所有匹配的路由记录中合并的 `meta` 属性。

#### 继承自 %{#Properties-meta-Inherited-from}%

\_RouteLocationBase.meta

___

### name %{#Properties-name}%

• **name**: `undefined` \| ``null`` \| [`RouteRecordName`](../index.md#routerecordname)

匹配的路由名称。

#### 继承自 %{#Properties-name-Inherited-from}%

\_RouteLocationBase.name

___

### params %{#Properties-params}%

• **params**: [`RouteParams`](../index.md#routeparams)

从 `path` 中提取出来并解码后的参数对象。

#### 继承自 %{#Properties-params-Inherited-from}%

\_RouteLocationBase.params

___

### path %{#Properties-path}%

• **path**: `string`

经过百分号编码的 URL 中的 pathname 段。

#### 继承自 %{#Properties-path-Inherited-from}%

\_RouteLocationBase.path

___

### query %{#Properties-query}%

• **query**: [`LocationQuery`](../index.md#locationquery)

代表当前地址的 `search` 属性的对象

#### 继承自 %{#Properties-query-Inherited-from}%

\_RouteLocationBase.query

___

### redirectedFrom %{#Properties-redirectedFrom}%

• **redirectedFrom**: `undefined` \| [`RouteLocation`](RouteLocation.md)

包含在重定向到当前地址之前，我们最初想访问的地址。

#### 继承自 %{#Properties-redirectedFrom-Inherited-from}%

\_RouteLocationBase.redirectedFrom
