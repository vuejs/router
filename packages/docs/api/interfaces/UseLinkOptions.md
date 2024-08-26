---
editLink: false
---

[API Documentation](../index.md) / UseLinkOptions

# Interface: UseLinkOptions\<Name\>

Options passed to [useLink](../index.md#useLink).

## Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](../index.md#RouteMap) = keyof [`RouteMap`](../index.md#RouteMap) |

## Properties

### replace

• `Optional` **replace**: `MaybeRef`\<`undefined` \| `boolean`\>

___

### to

• **to**: `MaybeRef`\<`string` \| [`RouteLocationAsRelativeGeneric`](RouteLocationAsRelativeGeneric.md) \| [`RouteLocationAsPathGeneric`](RouteLocationAsPathGeneric.md) \| [`RouteLocationAsRelativeTyped`](RouteLocationAsRelativeTyped.md)\<[`RouteMapGeneric`](../index.md#RouteMapGeneric), `Name`\>\>
