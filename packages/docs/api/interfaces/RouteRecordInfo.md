---
editLink: false
---

[API Documentation](../index.md) / RouteRecordInfo

# Interface: RouteRecordInfo\<Name, Path, ParamsRaw, Params, Meta\>

Helper type to define a Typed `RouteRecord`

**`See`**

[RouteRecord](../index.md#RouteRecord)

## Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends `string` \| `symbol` = `string` |
| `Path` | extends `string` = `string` |
| `ParamsRaw` | extends [`RouteParamsRawGeneric`](../index.md#RouteParamsRawGeneric) = [`RouteParamsRawGeneric`](../index.md#RouteParamsRawGeneric) |
| `Params` | extends [`RouteParamsGeneric`](../index.md#RouteParamsGeneric) = [`RouteParamsGeneric`](../index.md#RouteParamsGeneric) |
| `Meta` | extends [`RouteMeta`](RouteMeta.md) = [`RouteMeta`](RouteMeta.md) |

## Properties

### meta

• **meta**: `Meta`

___

### name

• **name**: `Name`

___

### params

• **params**: `Params`

___

### paramsRaw

• **paramsRaw**: `ParamsRaw`

___

### path

• **path**: `Path`
