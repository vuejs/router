---
editLink: false
---

[API 参考](../index.md) / RouteLocationMatched

# 接口：RouteLocationMatched

一条[路由记录](../index.md#routerecord)的规范化版本。

## 继承关系 %{#Hierarchy}%

- [`RouteRecordNormalized`](RouteRecordNormalized.md)

  ↳ **`RouteLocationMatched`**

## 属性 %{#Properties}%

### aliasOf %{#Properties-aliasOf}%

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

定义了是否这条记录是另一条的别名。如果记录是原始记录，则该属性为 `undefined`。

#### 继承自 %{#Properties-aliasOf-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[aliasOf](RouteRecordNormalized.md#aliasof)

___

### beforeEnter %{#Properties-beforeEnter}%

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)\<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)\<`undefined`\>[]

被注册的 beforeEnter 守卫

#### 继承自 %{#Properties-beforeEnter-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[beforeEnter](RouteRecordNormalized.md#beforeenter)

___

### children %{#Properties-children}%

• **children**: [`RouteRecordRaw`](../index.md#routerecordraw)[]

嵌套的路由记录。

#### 继承自 %{#Properties-children-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[children](RouteRecordNormalized.md#children)

___

### components %{#Properties-components}%

• **components**: `undefined` \| ``null`` \| `Record`\<`string`, [`RouteComponent`](../index.md#routecomponent)\>

{@inheritDoc RouteRecordMultipleViews.components}

#### Override %{#Properties-components-Overrides}%

[RouteRecordNormalized](RouteRecordNormalized.md).[components](RouteRecordNormalized.md#components)

___

### instances %{#Properties-instances}%

• **instances**: `Record`\<`string`, `undefined` \| ``null`` \| `ComponentPublicInstance`\>

<!-- TODO: translation -->

Mounted route component instance。 Having the instances on the record mean beforeRouteUpdate and beforeRouteLeave guards can only be invoked with the latest mounted app instance if there are multiple application instances rendering the same view, basically duplicating the content on the page, which shouldn't happen in practice. It will work if multiple apps are rendering different named views.

#### 继承自 %{#Properties-instances-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[instances](RouteRecordNormalized.md#instances)

___

### meta %{#Properties-meta}%

• **meta**: [`RouteMeta`](RouteMeta.md)

<!-- TODO: translation -->

Arbitrary data attached to the record.

#### 继承自 %{#Properties-meta-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[meta](RouteRecordNormalized.md#meta)

___

### name %{#Properties-name}%

• **name**: `undefined` \| [`RouteRecordName`](../index.md#routerecordname)

<!-- TODO: translation -->

Name for the route record. Must be unique.

#### 继承自 %{#Properties-name-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[name](RouteRecordNormalized.md#name)

___

### path %{#Properties-path}%

• **path**: `string`

<!-- TODO: translation -->

Path of the record. Should start with `/` unless the record is the child of another record.

#### 继承自 %{#Properties-path-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[path](RouteRecordNormalized.md#path)

___

### props %{#Properties-props}%

• **props**: `Record`\<`string`, `_RouteRecordProps`\>

<!-- TODO: translation -->

Allow passing down params as props to the component rendered by `router-view`. Should be an object with the same keys as `components` or a boolean to be applied to every component.

#### 继承自 %{#Properties-props-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[props](RouteRecordNormalized.md#props)

___

### redirect %{#Properties-redirect}%

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

<!-- TODO: translation -->

Where to redirect if the route is directly matched. The redirection happens before any navigation guard and triggers a new navigation with the new target location.

#### 继承自 %{#Properties-redirect-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[redirect](RouteRecordNormalized.md#redirect)
