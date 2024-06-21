---
editLink: false
---

[API Documentation](../index.md) / NavigationGuardNext

# Interface: NavigationGuardNext

`next()` callback passed to navigation guards.

## Callable

### NavigationGuardNext

▸ **NavigationGuardNext**(): `void`

#### Returns

`void`

### NavigationGuardNext

▸ **NavigationGuardNext**(`error`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |

#### Returns

`void`

### NavigationGuardNext

▸ **NavigationGuardNext**(`location`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `location` | `string` \| [`RouteLocationAsRelativeGeneric`](RouteLocationAsRelativeGeneric.md) \| [`RouteLocationAsPathGeneric`](RouteLocationAsPathGeneric.md) |

#### Returns

`void`

### NavigationGuardNext

▸ **NavigationGuardNext**(`valid`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `valid` | `undefined` \| `boolean` |

#### Returns

`void`

### NavigationGuardNext

▸ **NavigationGuardNext**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`NavigationGuardNextCallback`](../index.md#NavigationGuardNextCallback) |

#### Returns

`void`
