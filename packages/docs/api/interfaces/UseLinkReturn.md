---
editLink: false
---

[API Documentation](../index.md) / UseLinkReturn

# Interface: UseLinkReturn\<Name\>

Return type of [useLink](../index.md#useLink).

## Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](../index.md#RouteMap) = keyof [`RouteMap`](../index.md#RouteMap) |

## Properties

### href

• **href**: `ComputedRef`\<`string`\>

___

### isActive

• **isActive**: `ComputedRef`\<`boolean`\>

___

### isExactActive

• **isExactActive**: `ComputedRef`\<`boolean`\>

___

### route

• **route**: `ComputedRef`\<[`RouteLocationResolvedGeneric`](RouteLocationResolvedGeneric.md)\>

## Methods

### navigate

▸ **navigate**(`e?`): `Promise`\<`void` \| [`NavigationFailure`](NavigationFailure.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `e?` | `MouseEvent` |

#### Returns

`Promise`\<`void` \| [`NavigationFailure`](NavigationFailure.md)\>
