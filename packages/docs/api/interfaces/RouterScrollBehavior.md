---
sidebar: "auto"
editLinks: false
sidebarDepth: 3
---

[API Documentation](../index.md) / RouterScrollBehavior

# Interface: RouterScrollBehavior

## Callable

### RouterScrollBehavior

▸ **RouterScrollBehavior**(`to`, `from`, `savedPosition`): `Awaitable`<``false`` \| `void` \| `ScrollPosition`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) | Route location where we are navigating to |
| `from` | [`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md) | Route location where we are navigating from |
| `savedPosition` | ``null`` \| `_ScrollPositionNormalized` | saved position if it exists, `null` otherwise |

#### Returns

`Awaitable`<``false`` \| `void` \| `ScrollPosition`\>
