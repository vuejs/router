---
editLink: false
---

[API Documentation](../index.md) / RouteLocationAsRelativeGeneric

# Interface: RouteLocationAsRelativeGeneric

Generic version of [RouteLocationAsRelative](../index.md#RouteLocationAsRelative). It is used when no [RouteMap](../index.md#RouteMap) is provided.

## Hierarchy

- [`RouteQueryAndHash`](RouteQueryAndHash.md)

- [`RouteLocationOptions`](RouteLocationOptions.md)

  ↳ **`RouteLocationAsRelativeGeneric`**

  ↳↳ [`RouteLocationAsRelativeTyped`](RouteLocationAsRelativeTyped.md)

## Properties

### force

• `Optional` **force**: `boolean`

Triggers the navigation even if the location is the same as the current one.
Note this will also add a new entry to the history unless `replace: true`
is passed.

#### Inherited from

[RouteLocationOptions](RouteLocationOptions.md).[force](RouteLocationOptions.md#force)

___

### hash

• `Optional` **hash**: `string`

#### Inherited from

[RouteQueryAndHash](RouteQueryAndHash.md).[hash](RouteQueryAndHash.md#hash)

___

### name

• `Optional` **name**: [`RouteRecordNameGeneric`](../index.md#RouteRecordNameGeneric)

___

### params

• `Optional` **params**: [`RouteParamsRawGeneric`](../index.md#RouteParamsRawGeneric)

___

### path

• `Optional` **path**: `undefined`

A relative path to the current location. This property should be removed

___

### query

• `Optional` **query**: [`LocationQueryRaw`](../index.md#LocationQueryRaw)

#### Inherited from

[RouteQueryAndHash](RouteQueryAndHash.md).[query](RouteQueryAndHash.md#query)

___

### replace

• `Optional` **replace**: `boolean`

Replace the entry in the history instead of pushing a new entry

#### Inherited from

[RouteLocationOptions](RouteLocationOptions.md).[replace](RouteLocationOptions.md#replace)

___

### state

• `Optional` **state**: [`HistoryState`](HistoryState.md)

State to save using the History API. This cannot contain any reactive
values and some primitives like Symbols are forbidden. More info at
https://developer.mozilla.org/en-US/docs/Web/API/History/state

#### Inherited from

[RouteLocationOptions](RouteLocationOptions.md).[state](RouteLocationOptions.md#state)
