---
editLink: false
---

[API Documentation](../index.md) / RouterMatcher

# Interface: RouterMatcher

Internal RouterMatcher

## Properties

### addRoute

• **addRoute**: (`record`: [`RouteRecordRaw`](../index.md#RouteRecordRaw), `parent?`: `RouteRecordMatcher`) => () => `void`

#### Type declaration

▸ (`record`, `parent?`): () => `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `record` | [`RouteRecordRaw`](../index.md#RouteRecordRaw) |
| `parent?` | `RouteRecordMatcher` |

##### Returns

`fn`

▸ (): `void`

##### Returns

`void`

___

### clearRoutes

• **clearRoutes**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

___

### getRecordMatcher

• **getRecordMatcher**: (`name`: `NonNullable`\<[`RouteRecordNameGeneric`](../index.md#RouteRecordNameGeneric)\>) => `undefined` \| `RouteRecordMatcher`

#### Type declaration

▸ (`name`): `undefined` \| `RouteRecordMatcher`

##### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `NonNullable`\<[`RouteRecordNameGeneric`](../index.md#RouteRecordNameGeneric)\> |

##### Returns

`undefined` \| `RouteRecordMatcher`

___

### getRoutes

• **getRoutes**: () => `RouteRecordMatcher`[]

#### Type declaration

▸ (): `RouteRecordMatcher`[]

##### Returns

`RouteRecordMatcher`[]

___

### resolve

• **resolve**: (`location`: `MatcherLocationRaw`, `currentLocation`: [`MatcherLocation`](MatcherLocation.md)) => [`MatcherLocation`](MatcherLocation.md)

Resolves a location. Gives access to the route record that corresponds to the actual path as well as filling the corresponding params objects

**`Param`**

MatcherLocationRaw to resolve to a url

**`Param`**

MatcherLocation of the current location

#### Type declaration

▸ (`location`, `currentLocation`): [`MatcherLocation`](MatcherLocation.md)

Resolves a location. Gives access to the route record that corresponds to the actual path as well as filling the corresponding params objects

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `location` | `MatcherLocationRaw` | MatcherLocationRaw to resolve to a url |
| `currentLocation` | [`MatcherLocation`](MatcherLocation.md) | MatcherLocation of the current location |

##### Returns

[`MatcherLocation`](MatcherLocation.md)

## Methods

### removeRoute

▸ **removeRoute**(`matcher`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `matcher` | `RouteRecordMatcher` |

#### Returns

`void`

▸ **removeRoute**(`name`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `NonNullable`\<[`RouteRecordNameGeneric`](../index.md#RouteRecordNameGeneric)\> |

#### Returns

`void`
