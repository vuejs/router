---
sidebar: "auto"
editLinks: false
sidebarDepth: 3
---

[API Documentation](../index.md) / NavigationGuard

# Interface: NavigationGuard

## Callable

### NavigationGuard

▸ **NavigationGuard**(`to`, `from`, `next`): `NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>

Navigation guard. See [Navigation
Guards](/guide/advanced/navigation-guards.md).

#### Parameters

| Name | Type |
| :------ | :------ |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `from` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `next` | [`NavigationGuardNext`](NavigationGuardNext.md) |

#### Returns

`NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>
