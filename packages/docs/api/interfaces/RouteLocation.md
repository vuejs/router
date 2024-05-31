---
editLink: false
---

[API Documentation](../index.md) / RouteLocation

# Interface: RouteLocation

[RouteLocationRaw](../index.md#RouteLocationRaw) resolved using the matcher

## Hierarchy

- `_RouteLocationBase`

  ↳ **`RouteLocation`**

## Properties

### fullPath

• **fullPath**: `string`

The whole location including the `search` and `hash`. This string is
percentage encoded.

#### Inherited from

\_RouteLocationBase.fullPath

___

### hash

• **hash**: `string`

Hash of the current location. If present, starts with a `#`.

#### Inherited from

\_RouteLocationBase.hash

___

### matched

• **matched**: [`RouteRecordNormalized`](RouteRecordNormalized.md)[]

Array of [RouteRecord](../index.md#RouteRecord) containing components as they were
passed when adding records. It can also contain redirect records. This
can't be used directly

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Merged `meta` properties from all the matched route records.

#### Inherited from

\_RouteLocationBase.meta

___

### name

• **name**: `undefined` \| ``null`` \| [`RouteRecordName`](../index.md#RouteRecordName)

Name of the matched record

#### Inherited from

\_RouteLocationBase.name

___

### params

• **params**: [`RouteParams`](../index.md#RouteParams)

Object of decoded params extracted from the `path`.

#### Inherited from

\_RouteLocationBase.params

___

### path

• **path**: `string`

Percentage encoded pathname section of the URL.

#### Inherited from

\_RouteLocationBase.path

___

### query

• **query**: [`LocationQuery`](../index.md#LocationQuery)

Object representation of the `search` property of the current location.

#### Inherited from

\_RouteLocationBase.query

___

### redirectedFrom

• **redirectedFrom**: `undefined` \| [`RouteLocation`](RouteLocation.md)

Contains the location we were initially trying to access before ending up
on the current location.

#### Inherited from

\_RouteLocationBase.redirectedFrom
