---
editLink: false
---

[API Documentation](../index.md) / RouteLocationNormalizedTyped

# Interface: RouteLocationNormalizedTyped\<RouteMap, Name\>

Helper to generate a type safe version of the [RouteLocationNormalized](../index.md#RouteLocationNormalized) type.

## Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](../index.md#RouteMapGeneric) = [`RouteMapGeneric`](../index.md#RouteMapGeneric) |
| `Name` | extends keyof `RouteMap` = keyof `RouteMap` |

## Hierarchy

- [`RouteLocationNormalizedGeneric`](RouteLocationNormalizedGeneric.md)

  ↳ **`RouteLocationNormalizedTyped`**

## Properties

### fullPath

• **fullPath**: `string`

The whole location including the `search` and `hash`. This string is
percentage encoded.

#### Inherited from

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[fullPath](RouteLocationNormalizedGeneric.md#fullPath)

___

### hash

• **hash**: `string`

Hash of the current location. If present, starts with a `#`.

#### Inherited from

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[hash](RouteLocationNormalizedGeneric.md#hash)

___

### matched

• **matched**: [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

Array of [RouteRecordNormalized](RouteRecordNormalized.md)

#### Overrides

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[matched](RouteLocationNormalizedGeneric.md#matched)

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Merged `meta` properties from all the matched route records.

#### Inherited from

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[meta](RouteLocationNormalizedGeneric.md#meta)

___

### name

• **name**: `Extract`\<`Name`, `string` \| `symbol`\>

Name of the matched record

#### Overrides

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[name](RouteLocationNormalizedGeneric.md#name)

___

### params

• **params**: `RouteMap`[`Name`][``"params"``]

Object of decoded params extracted from the `path`.

#### Overrides

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[params](RouteLocationNormalizedGeneric.md#params)

___

### path

• **path**: `string`

Percentage encoded pathname section of the URL.

#### Inherited from

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[path](RouteLocationNormalizedGeneric.md#path)

___

### query

• **query**: [`LocationQuery`](../index.md#LocationQuery)

Object representation of the `search` property of the current location.

#### Inherited from

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[query](RouteLocationNormalizedGeneric.md#query)

___

### redirectedFrom

• **redirectedFrom**: `undefined` \| [`RouteLocationGeneric`](RouteLocationGeneric.md)

Contains the location we were initially trying to access before ending up
on the current location.

#### Inherited from

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[redirectedFrom](RouteLocationNormalizedGeneric.md#redirectedFrom)
