---
editLink: false
---

[API Documentation](../index.md) / NavigationFailure

# Interface: NavigationFailure

Extended Error that contains extra information regarding a failed navigation.

## Hierarchy %{#Hierarchy}%

- `Error`

  ↳ **`NavigationFailure`**

## Properties %{#Properties}%

### cause %{#Properties-cause}%

• `Optional` **cause**: `unknown`

#### Inherited from %{#Properties-cause-Inherited-from}%

Error.cause

___

### from %{#Properties-from}%

• **from**: [`RouteLocationNormalized`](RouteLocationNormalized.md)

Route location we were navigating from

___

### message %{#Properties-message}%

• **message**: `string`

#### Inherited from %{#Properties-message-Inherited-from}%

Error.message

___

### name %{#Properties-name}%

• **name**: `string`

#### Inherited from %{#Properties-name-Inherited-from}%

Error.name

___

### stack %{#Properties-stack}%

• `Optional` **stack**: `string`

#### Inherited from %{#Properties-stack-Inherited-from}%

Error.stack

___

### to %{#Properties-to}%

• **to**: [`RouteLocationNormalized`](RouteLocationNormalized.md)

Route location we were navigating to

___

### type %{#Properties-type}%

• **type**: `NAVIGATION_ABORTED` \| `NAVIGATION_CANCELLED` \| `NAVIGATION_DUPLICATED`

Type of the navigation. One of [NavigationFailureType](../enums/NavigationFailureType.md)
