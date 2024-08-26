---
editLink: false
---

[API Documentation](../index.md) / \_RouteLocationBase

# Interface: \_RouteLocationBase

Base properties for a normalized route location.

## Hierarchy

- `Pick`\<[`MatcherLocation`](MatcherLocation.md), ``"name"`` \| ``"path"`` \| ``"params"`` \| ``"meta"``\>

  ↳ **`_RouteLocationBase`**

  ↳↳ [`RouteLocationGeneric`](RouteLocationGeneric.md)

  ↳↳ [`RouteLocationNormalizedGeneric`](RouteLocationNormalizedGeneric.md)

## Properties

### fullPath

• **fullPath**: `string`

The whole location including the `search` and `hash`. This string is
percentage encoded.

___

### hash

• **hash**: `string`

Hash of the current location. If present, starts with a `#`.

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Merged `meta` properties from all the matched route records.

#### Inherited from

Pick.meta

___

### name

• **name**: ``null`` \| [`RouteRecordNameGeneric`](../index.md#RouteRecordNameGeneric)

Name of the matched record

#### Inherited from

Pick.name

___

### params

• **params**: [`RouteParamsGeneric`](../index.md#RouteParamsGeneric)

Object of decoded params extracted from the `path`.

#### Inherited from

Pick.params

___

### path

• **path**: `string`

Percentage encoded pathname section of the URL.

#### Inherited from

Pick.path

___

### query

• **query**: [`LocationQuery`](../index.md#LocationQuery)

Object representation of the `search` property of the current location.

___

### redirectedFrom

• **redirectedFrom**: `undefined` \| [`RouteLocationGeneric`](RouteLocationGeneric.md)

Contains the location we were initially trying to access before ending up
on the current location.
