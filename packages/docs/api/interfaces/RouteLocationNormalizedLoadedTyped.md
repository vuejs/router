---
editLink: false
---

[API Documentation](../index.md) / RouteLocationNormalizedLoadedTyped

# Interface: RouteLocationNormalizedLoadedTyped\<RouteMap, Name\>

Helper to generate a type safe version of the [RouteLocationNormalizedLoaded](../index.md#RouteLocationNormalizedLoaded) type.

## Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](../index.md#RouteMapGeneric) = [`RouteMapGeneric`](../index.md#RouteMapGeneric) |
| `Name` | extends keyof `RouteMap` = keyof `RouteMap` |

## Hierarchy

- [`RouteLocationNormalizedLoadedGeneric`](RouteLocationNormalizedLoadedGeneric.md)

  ↳ **`RouteLocationNormalizedLoadedTyped`**

## Properties

### fullPath

• **fullPath**: `string`

The whole location including the `search` and `hash`. This string is
percentage encoded.

#### Inherited from

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[fullPath](RouteLocationNormalizedLoadedGeneric.md#fullPath)

___

### hash

• **hash**: `string`

Hash of the current location. If present, starts with a `#`.

#### Inherited from

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[hash](RouteLocationNormalizedLoadedGeneric.md#hash)

___

### matched

• **matched**: [`RouteLocationMatched`](RouteLocationMatched.md)[]

Array of [RouteLocationMatched](RouteLocationMatched.md) containing only plain components (any
lazy-loaded components have been loaded and were replaced inside the
`components` object) so it can be directly used to display routes. It
cannot contain redirect records either. **This property is non-enumerable**.

#### Inherited from

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[matched](RouteLocationNormalizedLoadedGeneric.md#matched)

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Merged `meta` properties from all the matched route records.

#### Inherited from

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[meta](RouteLocationNormalizedLoadedGeneric.md#meta)

___

### name

• **name**: `Extract`\<`Name`, `string` \| `symbol`\>

Name of the matched record

#### Overrides

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[name](RouteLocationNormalizedLoadedGeneric.md#name)

___

### params

• **params**: `RouteMap`[`Name`][``"params"``]

Object of decoded params extracted from the `path`.

#### Overrides

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[params](RouteLocationNormalizedLoadedGeneric.md#params)

___

### path

• **path**: `string`

Percentage encoded pathname section of the URL.

#### Inherited from

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[path](RouteLocationNormalizedLoadedGeneric.md#path)

___

### query

• **query**: [`LocationQuery`](../index.md#LocationQuery)

Object representation of the `search` property of the current location.

#### Inherited from

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[query](RouteLocationNormalizedLoadedGeneric.md#query)

___

### redirectedFrom

• **redirectedFrom**: `undefined` \| [`RouteLocationGeneric`](RouteLocationGeneric.md)

Contains the location we were initially trying to access before ending up
on the current location.

#### Inherited from

[RouteLocationNormalizedLoadedGeneric](RouteLocationNormalizedLoadedGeneric.md).[redirectedFrom](RouteLocationNormalizedLoadedGeneric.md#redirectedFrom)
