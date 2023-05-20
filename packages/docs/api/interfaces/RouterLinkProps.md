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

---

### ariaCurrentValue %{#Properties-ariaCurrentValue}%

• `Optional` **ariaCurrentValue**: `"location"` \| `"time"` \| `"page"` \| `"step"` \| `"date"` \| `"true"` \| `"false"`

Value passed to the attribute `aria-current` when the link is exact active.

**`Default Value`**

`'page'`

---

### custom %{#Properties-custom}%

• `Optional` **custom**: `boolean`

Whether RouterLink should not wrap its content in an `a` tag. Useful when
using `v-slot` to create a custom RouterLink

---

### exactActiveClass %{#Properties-exactActiveClass}%

• `Optional` **exactActiveClass**: `string`

Class to apply when the link is exact active

---

### replace %{#Properties-replace}%

• `Optional` **replace**: `boolean`

Calls `router.replace` instead of `router.push`.

#### Inherited from %{#Properties-replace-Inherited-from}%

RouterLinkOptions.replace

---

### to %{#Properties-to}%

• **to**: [`RouteLocationRaw`](../index.md#Type-Aliases-RouteLocationRaw)

Route Location the link should navigate to when clicked on.

#### Inherited from %{#Properties-to-Inherited-from}%

RouterLinkOptions.to
