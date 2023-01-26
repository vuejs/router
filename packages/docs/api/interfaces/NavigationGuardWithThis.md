---
editLink: false
---

[API Documentation](../index.md) / NavigationGuardWithThis

# Interface: NavigationGuardWithThis<T\>

## Type parameters %{#Type-parameters}%

| Name |
| :------ |
| `T` |

## Callable %{#Callable}%

### NavigationGuardWithThis %{#Callable-NavigationGuardWithThis}%

▸ **NavigationGuardWithThis**(`this`, `to`, `from`, `next`): `NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>

Navigation guard. See [Navigation
Guards](/guide/advanced/navigation-guards.md).

#### Parameters %{#Callable-NavigationGuardWithThis-Parameters}%

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `from` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `next` | [`NavigationGuardNext`](NavigationGuardNext.md) |

#### Returns %{#Callable-NavigationGuardWithThis-Returns}%

`NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>
