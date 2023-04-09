---
editLink: false
---

[API Documentation](../index.md) / NavigationFailure

# 接口：NavigationFailure %{#interface-navigationfailure}%

Error 类型的扩展，包含导航失败的额外信息。

## 继承关系 %{#Hierarchy}%

- `Error`

  ↳ **`NavigationFailure`**

## 属性 %{#Properties}%

### cause %{#Properties-cause}%

• `可选` **cause**: `unknown`

#### 继承自 %{#Properties-cause-Inherited-from}%

Error.cause

___

### from %{#Properties-from}%

• **from**: [`RouteLocationNormalized`](RouteLocationNormalized.md)

上一个路由位置

___

### message %{#Properties-message}%

• **message**: `string`

#### 继承自 %{#Properties-message-Inherited-from}%

Error.message

___

### name %{#Properties-name}%

• **name**: `string`

#### 继承自 %{#Properties-name-Inherited-from}%

Error.name

___

### stack %{#Properties-stack}%

• `可选` **stack**: `string`

#### 继承自 %{#Properties-stack-Inherited-from}%

Error.stack

___

### to %{#Properties-to}%

• **to**: [`RouteLocationNormalized`](RouteLocationNormalized.md)

Route location we were navigating to

___

### type %{#Properties-type}%

• **type**: `NAVIGATION_ABORTED` \| `NAVIGATION_CANCELLED` \| `NAVIGATION_DUPLICATED`

Type of the navigation. One of [NavigationFailureType](../enums/NavigationFailureType.md)
