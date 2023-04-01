---
editLink: false
---

[API Documentation](../index.md) / RouterLinkProps

# Interface: RouterLinkProps

## Hierarchy %{#Hierarchy}%

- `RouterLinkOptions`

  ↳ **`RouterLinkProps`**

## Properties %{#Properties}%

### activeClass %{#Properties-activeClass}%

• `Optional` **activeClass**: `string`

Class to apply when the link is active

___

### ariaCurrentValue %{#Properties-ariaCurrentValue}%

• `Optional` **ariaCurrentValue**: ``"location"`` \| ``"time"`` \| ``"page"`` \| ``"step"`` \| ``"date"`` \| ``"true"`` \| ``"false"``

Value passed to the attribute `aria-current` when the link is exact active.

**`Default Value`**

`'page'`

___

### custom %{#Properties-custom}%

• `Optional` **custom**: `boolean`

Whether RouterLink should not wrap its content in an `a` tag. Useful when
using `v-slot` to create a custom RouterLink

___

### exactActiveClass %{#Properties-exactActiveClass}%

• `Optional` **exactActiveClass**: `string`

Class to apply when the link is exact active

___

### replace %{#Properties-replace}%

• `Optional` **replace**: `boolean`

Calls `router.replace` instead of `router.push`.

#### Inherited from %{#Properties-replace-Inherited-from}%

RouterLinkOptions.replace

___

### to %{#Properties-to}%

• **to**: [`RouteLocationRaw`](../index.md#routelocationraw)

Route Location the link should navigate to when clicked on.

#### Inherited from %{#Properties-to-Inherited-from}%

RouterLinkOptions.to
