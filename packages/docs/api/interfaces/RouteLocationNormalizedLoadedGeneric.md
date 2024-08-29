---
editLink: false
---

[API Documentation](../index.md) / RouteLocationNormalizedLoadedGeneric

# Interface: RouteLocationNormalizedLoadedGeneric

Generic version of [RouteLocationNormalizedLoaded](../index.md#RouteLocationNormalizedLoaded) that is used when no [RouteMap](../index.md#RouteMap) is provided.

## Hierarchy

- [`RouteLocationNormalizedGeneric`](RouteLocationNormalizedGeneric.md)

  ↳ **`RouteLocationNormalizedLoadedGeneric`**

  ↳↳ [`RouteLocationNormalizedLoadedTyped`](RouteLocationNormalizedLoadedTyped.md)

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

• **matched**: [`RouteLocationMatched`](RouteLocationMatched.md)[]

Array of [RouteLocationMatched](RouteLocationMatched.md) containing only plain components (any
lazy-loaded components have been loaded and were replaced inside the
`components` object) so it can be directly used to display routes. It
cannot contain redirect records either. **This property is non-enumerable**.

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

• **name**: [`RouteRecordNameGeneric`](../index.md#RouteRecordNameGeneric)

Name of the matched record

#### Inherited from

[RouteLocationNormalizedGeneric](RouteLocationNormalizedGeneric.md).[name](RouteLocationNormalizedGeneric.md#name)

___

### params

• **params**: [`RouteParamsGeneric`](../index.md#RouteParamsGeneric)

Object of decoded params extracted from the `path`.

#### Inherited from

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
