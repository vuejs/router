---
editLink: false
---

[API Documentation](../index.md) / NavigationRedirectError

# Interface: NavigationRedirectError

Internal error used to detect a redirection.

## Hierarchy

- `Omit`\<[`NavigationFailure`](NavigationFailure.md), ``"to"`` \| ``"type"``\>

  ↳ **`NavigationRedirectError`**

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Omit.cause

___

### from

• **from**: [`RouteLocationNormalizedGeneric`](RouteLocationNormalizedGeneric.md)

Route location we were navigating from

#### Inherited from

Omit.from

___

### message

• **message**: `string`

#### Inherited from

Omit.message

___

### name

• **name**: `string`

#### Inherited from

Omit.name

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Omit.stack

___

### to

• **to**: `string` \| [`RouteLocationAsRelativeGeneric`](RouteLocationAsRelativeGeneric.md) \| [`RouteLocationAsPathGeneric`](RouteLocationAsPathGeneric.md)

___

### type

• **type**: [`NAVIGATION_GUARD_REDIRECT`](../enums/ErrorTypes.md#NAVIGATION_GUARD_REDIRECT)
