---
editLink: false
---

[API Documentation](../index.md) / NavigationGuardWithThis

# Interface: NavigationGuardWithThis<T\>

Navigation guard. See [Navigation
Guards](/guide/advanced/navigation-guards.md).

## Type parameters %{#Type-parameters}%

| Name |
| :------ |
| `T` |

## Callable %{#Callable}%

### NavigationGuardWithThis %{#Callable-NavigationGuardWithThis}%

▸ **NavigationGuardWithThis**(`this`, `to`, `from`, `next`): `NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>

#### Parameters %{#Callable-NavigationGuardWithThis-Parameters}%

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `from` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `next` | [`NavigationGuardNext`](NavigationGuardNext.md) |

#### Returns %{#Callable-NavigationGuardWithThis-Returns}%

`NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>
