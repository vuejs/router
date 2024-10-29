---
editLink: false
---

[API Documentation](../index.md) / RouteLocationResolvedTyped

# Interface: RouteLocationResolvedTyped\<RouteMap, Name\>

Helper to generate a type safe version of the [RouteLocationResolved](../index.md#RouteLocationResolved) type.

## Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](../index.md#RouteMapGeneric) |
| `Name` | extends keyof `RouteMap` |

## Hierarchy

- [`RouteLocationTyped`](RouteLocationTyped.md)\<`RouteMap`, `Name`\>

  ↳ **`RouteLocationResolvedTyped`**

## Properties

### fullPath

• **fullPath**: `string`

The whole location including the `search` and `hash`. This string is
percentage encoded.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[fullPath](RouteLocationTyped.md#fullPath)

___

### hash

• **hash**: `string`

Hash of the current location. If present, starts with a `#`.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[hash](RouteLocationTyped.md#hash)

___

### href

• **href**: `string`

Resolved `href` for the route location that will be set on the `<a href="...">`.

___

### matched

• **matched**: [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

Array of [RouteRecord](../index.md#RouteRecord) containing components as they were
passed when adding records. It can also contain redirect records. This
can't be used directly. **This property is non-enumerable**.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[matched](RouteLocationTyped.md#matched)

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Merged `meta` properties from all the matched route records.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[meta](RouteLocationTyped.md#meta)

___

### name

• **name**: `Extract`\<`Name`, `string` \| `symbol`\>

Name of the matched record

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[name](RouteLocationTyped.md#name)

___

### params

• **params**: `RouteMap`[`Name`][``"params"``]

Object of decoded params extracted from the `path`.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[params](RouteLocationTyped.md#params)

___

### path

• **path**: `string`

Percentage encoded pathname section of the URL.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[path](RouteLocationTyped.md#path)

___

### query

• **query**: [`LocationQuery`](../index.md#LocationQuery)

Object representation of the `search` property of the current location.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[query](RouteLocationTyped.md#query)

___

### redirectedFrom

• **redirectedFrom**: `undefined` \| [`RouteLocationGeneric`](RouteLocationGeneric.md)

Contains the location we were initially trying to access before ending up
on the current location.

#### Inherited from

[RouteLocationTyped](RouteLocationTyped.md).[redirectedFrom](RouteLocationTyped.md#redirectedFrom)
