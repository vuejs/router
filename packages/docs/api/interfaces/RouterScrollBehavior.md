---
editLink: false
---

[API Documentation](../index.md) / RouterScrollBehavior

# Interface: RouterScrollBehavior

## Callable %{#Callable}%

### RouterScrollBehavior %{#Callable-RouterScrollBehavior}%

▸ **RouterScrollBehavior**(`to`, `from`, `savedPosition`): `Awaitable`<``false`` \| `void` \| `ScrollPosition`\>

#### Parameters %{#Callable-RouterScrollBehavior-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) | Route location where we are navigating to |
| `from` | [`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md) | Route location where we are navigating from |
| `savedPosition` | ``null`` \| `_ScrollPositionNormalized` | saved position if it exists, `null` otherwise |

#### Returns %{#Callable-RouterScrollBehavior-Returns}%

`Awaitable`<``false`` \| `void` \| `ScrollPosition`\>
