---
editLink: false
---

[API Documentation](../index.md) / NavigationGuard

# Interface: NavigationGuard

Navigation guard. See [Navigation
Guards](/guide/advanced/navigation-guards.md).

## Callable

### NavigationGuard

▸ **NavigationGuard**(`to`, `from`, `next`): `NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `from` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `next` | [`NavigationGuardNext`](NavigationGuardNext.md) |

#### Returns

`NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>
