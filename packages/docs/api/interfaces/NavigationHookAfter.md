---
editLink: false
---

[API Documentation](../index.md) / NavigationHookAfter

# Interface: NavigationHookAfter

Navigation hook triggered after a navigation is settled.

## Callable

### NavigationHookAfter

▸ **NavigationHookAfter**(`to`, `from`, `failure?`): `unknown`

#### Parameters

| Name | Type |
| :------ | :------ |
| `to` | [`RouteLocationNormalizedGeneric`](RouteLocationNormalizedGeneric.md) |
| `from` | [`RouteLocationNormalizedLoadedGeneric`](RouteLocationNormalizedLoadedGeneric.md) |
| `failure?` | `void` \| [`NavigationFailure`](NavigationFailure.md) |

#### Returns

`unknown`
