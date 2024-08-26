---
editLink: false
---

[API Documentation](../index.md) / RouteLocationPathRaw

# Interface: RouteLocationPathRaw

Route Location that can infer the possible paths.

## Hierarchy

- [`RouteQueryAndHash`](RouteQueryAndHash.md)

- [`MatcherLocationAsPath`](MatcherLocationAsPath.md)

- [`RouteLocationOptions`](RouteLocationOptions.md)

  ↳ **`RouteLocationPathRaw`**

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

### path

• **path**: `string`

#### Inherited from

[MatcherLocationAsPath](MatcherLocationAsPath.md).[path](MatcherLocationAsPath.md#path)

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
