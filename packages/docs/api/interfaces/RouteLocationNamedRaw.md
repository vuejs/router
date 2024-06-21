---
editLink: false
---

[API Documentation](../index.md) / RouteLocationNamedRaw

# Interface: RouteLocationNamedRaw

Route Location that can infer the necessary params based on the name.

## Hierarchy

- [`RouteQueryAndHash`](RouteQueryAndHash.md)

- [`LocationAsRelativeRaw`](LocationAsRelativeRaw.md)

- [`RouteLocationOptions`](RouteLocationOptions.md)

  ↳ **`RouteLocationNamedRaw`**

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

#### Inherited from

[LocationAsRelativeRaw](LocationAsRelativeRaw.md).[name](LocationAsRelativeRaw.md#name)

___

### params

• `Optional` **params**: [`RouteParamsRawGeneric`](../index.md#RouteParamsRawGeneric)

#### Inherited from

[LocationAsRelativeRaw](LocationAsRelativeRaw.md).[params](LocationAsRelativeRaw.md#params)

___

### path

• `Optional` **path**: `undefined`

Ignored path property since we are dealing with a relative location. Only `undefined` is allowed.

#### Inherited from

[LocationAsRelativeRaw](LocationAsRelativeRaw.md).[path](LocationAsRelativeRaw.md#path)

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
