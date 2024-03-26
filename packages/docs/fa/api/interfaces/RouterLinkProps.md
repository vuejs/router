---
editLink: false
---

[API Documentation](../index.md) / RouterLinkProps

# Interface: RouterLinkProps

## Hierarchy

- `RouterLinkOptions`

  ↳ **`RouterLinkProps`**

## Properties

### activeClass

• `Optional` **activeClass**: `string`

Class to apply when the link is active

___

### ariaCurrentValue

• `Optional` **ariaCurrentValue**: ``"location"`` \| ``"time"`` \| ``"page"`` \| ``"step"`` \| ``"date"`` \| ``"true"`` \| ``"false"``

Value passed to the attribute `aria-current` when the link is exact active.

**`Default Value`**

`'page'`

___

### custom

• `Optional` **custom**: `boolean`

Whether RouterLink should not wrap its content in an `a` tag. Useful when
using `v-slot` to create a custom RouterLink

___

### exactActiveClass

• `Optional` **exactActiveClass**: `string`

Class to apply when the link is exact active

___

### replace

• `Optional` **replace**: `boolean`

Calls `router.replace` instead of `router.push`.

#### Inherited from

RouterLinkOptions.replace

___

### to

• **to**: [`RouteLocationRaw`](../index.md#RouteLocationRaw)

Route Location the link should navigate to when clicked on.

#### Inherited from

RouterLinkOptions.to
