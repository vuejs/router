---
editLink: false
---

[API Documentation](../index.md) / RouteLocationTyped

# Interface: RouteLocationTyped\<RouteMap, Name\>

Helper to generate a type safe version of the [RouteLocation](../index.md#RouteLocation) type.

## Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](../index.md#RouteMapGeneric) |
| `Name` | extends keyof `RouteMap` |

## Hierarchy

- [`RouteLocationGeneric`](RouteLocationGeneric.md)

  ↳ **`RouteLocationTyped`**

  ↳↳ [`RouteLocationResolvedTyped`](RouteLocationResolvedTyped.md)

## Properties

### fullPath

• **fullPath**: `string`

The whole location including the `search` and `hash`. This string is
percentage encoded.

#### Inherited from

[RouteLocationGeneric](RouteLocationGeneric.md).[fullPath](RouteLocationGeneric.md#fullPath)

___

### hash

• **hash**: `string`

Hash of the current location. If present, starts with a `#`.

#### Inherited from

[RouteLocationGeneric](RouteLocationGeneric.md).[hash](RouteLocationGeneric.md#hash)

___

### matched

• **matched**: [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

Array of [RouteRecord](../index.md#RouteRecord) containing components as they were
passed when adding records. It can also contain redirect records. This
can't be used directly. **This property is non-enumerable**.

#### Inherited from

[RouteLocationGeneric](RouteLocationGeneric.md).[matched](RouteLocationGeneric.md#matched)

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Merged `meta` properties from all the matched route records.

#### Inherited from

[RouteLocationGeneric](RouteLocationGeneric.md).[meta](RouteLocationGeneric.md#meta)

___

### name

• **name**: `Extract`\<`Name`, `string` \| `symbol`\>

Name of the matched record

#### Overrides

[RouteLocationGeneric](RouteLocationGeneric.md).[name](RouteLocationGeneric.md#name)

___

### params

• **params**: `RouteMap`[`Name`][``"params"``]

Object of decoded params extracted from the `path`.

#### Overrides

[RouteLocationGeneric](RouteLocationGeneric.md).[params](RouteLocationGeneric.md#params)

___

### path

• **path**: `string`

Percentage encoded pathname section of the URL.

#### Inherited from

[RouteLocationGeneric](RouteLocationGeneric.md).[path](RouteLocationGeneric.md#path)

___

### query

• **query**: [`LocationQuery`](../index.md#LocationQuery)

Object representation of the `search` property of the current location.

#### Inherited from

[RouteLocationGeneric](RouteLocationGeneric.md).[query](RouteLocationGeneric.md#query)

___

### redirectedFrom

• **redirectedFrom**: `undefined` \| [`RouteLocationGeneric`](RouteLocationGeneric.md)

Contains the location we were initially trying to access before ending up
on the current location.

#### Inherited from

[RouteLocationGeneric](RouteLocationGeneric.md).[redirectedFrom](RouteLocationGeneric.md#redirectedFrom)
