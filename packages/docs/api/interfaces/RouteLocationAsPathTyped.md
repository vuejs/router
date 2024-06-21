---
editLink: false
---

[API Documentation](../index.md) / RouteLocationAsPathTyped

# Interface: RouteLocationAsPathTyped\<RouteMap, Name\>

Helper to generate a type safe version of the [RouteLocationAsPath](../index.md#RouteLocationAsPath) type.

## Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](../index.md#RouteMapGeneric) = [`RouteMapGeneric`](../index.md#RouteMapGeneric) |
| `Name` | extends keyof `RouteMap` = keyof `RouteMap` |

## Hierarchy

- [`RouteLocationAsPathGeneric`](RouteLocationAsPathGeneric.md)

  ↳ **`RouteLocationAsPathTyped`**

## Properties

### force

• `Optional` **force**: `boolean`

Triggers the navigation even if the location is the same as the current one.
Note this will also add a new entry to the history unless `replace: true`
is passed.

#### Inherited from

[RouteLocationAsPathGeneric](RouteLocationAsPathGeneric.md).[force](RouteLocationAsPathGeneric.md#force)

___

### hash

• `Optional` **hash**: `string`

#### Inherited from

[RouteLocationAsPathGeneric](RouteLocationAsPathGeneric.md).[hash](RouteLocationAsPathGeneric.md#hash)

___

### path

• **path**: `_LiteralUnion`\<`RouteMap`[`Name`][``"path"``]\>

Percentage encoded pathname section of the URL.

#### Overrides

[RouteLocationAsPathGeneric](RouteLocationAsPathGeneric.md).[path](RouteLocationAsPathGeneric.md#path)

___

### query

• `Optional` **query**: [`LocationQueryRaw`](../index.md#LocationQueryRaw)

#### Inherited from

[RouteLocationAsPathGeneric](RouteLocationAsPathGeneric.md).[query](RouteLocationAsPathGeneric.md#query)

___

### replace

• `Optional` **replace**: `boolean`

Replace the entry in the history instead of pushing a new entry

#### Inherited from

[RouteLocationAsPathGeneric](RouteLocationAsPathGeneric.md).[replace](RouteLocationAsPathGeneric.md#replace)

___

### state

• `Optional` **state**: [`HistoryState`](HistoryState.md)

State to save using the History API. This cannot contain any reactive
values and some primitives like Symbols are forbidden. More info at
https://developer.mozilla.org/en-US/docs/Web/API/History/state

#### Inherited from

[RouteLocationAsPathGeneric](RouteLocationAsPathGeneric.md).[state](RouteLocationAsPathGeneric.md#state)
