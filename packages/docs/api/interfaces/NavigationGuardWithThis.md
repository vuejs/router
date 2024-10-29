---
editLink: false
---

[API Documentation](../index.md) / NavigationGuardWithThis

# Interface: NavigationGuardWithThis\<T\>

Navigation Guard with a type parameter for `this`.

**`See`**

[TypesConfig](TypesConfig.md)

## Type parameters

| Name |
| :------ |
| `T` |

## Callable

### NavigationGuardWithThis

▸ **NavigationGuardWithThis**(`this`, `to`, `from`, `next`): [`_Awaitable`](../index.md#_Awaitable)\<[`NavigationGuardReturn`](../index.md#NavigationGuardReturn)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `to` | [`RouteLocationNormalizedGeneric`](RouteLocationNormalizedGeneric.md) |
| `from` | [`RouteLocationNormalizedLoadedGeneric`](RouteLocationNormalizedLoadedGeneric.md) |
| `next` | [`NavigationGuardNext`](NavigationGuardNext.md) |

#### Returns

[`_Awaitable`](../index.md#_Awaitable)\<[`NavigationGuardReturn`](../index.md#NavigationGuardReturn)\>
