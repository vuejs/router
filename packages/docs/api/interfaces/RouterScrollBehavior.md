---
editLink: false
---

[API Documentation](../index.md) / RouterScrollBehavior

# Interface: RouterScrollBehavior

Type of the `scrollBehavior` option that can be passed to `createRouter`.

## Callable

### RouterScrollBehavior

▸ **RouterScrollBehavior**(`to`, `from`, `savedPosition`): `Awaitable`\<``false`` \| `void` \| `ScrollPosition`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationNormalizedGeneric`](RouteLocationNormalizedGeneric.md) | Route location where we are navigating to |
| `from` | [`RouteLocationNormalizedLoadedGeneric`](RouteLocationNormalizedLoadedGeneric.md) | Route location where we are navigating from |
| `savedPosition` | ``null`` \| `_ScrollPositionNormalized` | saved position if it exists, `null` otherwise |

#### Returns

`Awaitable`\<``false`` \| `void` \| `ScrollPosition`\>
