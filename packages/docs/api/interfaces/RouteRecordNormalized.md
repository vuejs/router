---
editLink: false
---

[API Documentation](../index.md) / RouteRecordNormalized

# Interface: RouteRecordNormalized

Normalized version of a [route record](../index.md#routerecord).

## Hierarchy %{#Hierarchy}%

- **`RouteRecordNormalized`**

  ↳ [`RouteLocationMatched`](RouteLocationMatched.md)

## Properties %{#Properties}%

### aliasOf %{#Properties-aliasOf}%

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

Defines if this record is the alias of another one. This property is
`undefined` if the record is the original one.

___

### beforeEnter %{#Properties-beforeEnter}%

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Registered beforeEnter guards

___

### children %{#Properties-children}%

• **children**: [`RouteRecordRaw`](../index.md#routerecordraw)[]

Nested route records.

___

### components %{#Properties-components}%

• **components**: `undefined` \| ``null`` \| `Record`<`string`, `RawRouteComponent`\>

{@inheritDoc RouteRecordMultipleViews.components}

___

### instances %{#Properties-instances}%

• **instances**: `Record`<`string`, `undefined` \| ``null`` \| `ComponentPublicInstance`<{}, {}, {}, {}, {}, {}, {}, {}, ``false``, `ComponentOptionsBase`<`any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, {}, {}, `string`\>, {}\>\>

Mounted route component instances
Having the instances on the record mean beforeRouteUpdate and
beforeRouteLeave guards can only be invoked with the latest mounted app
instance if there are multiple application instances rendering the same
view, basically duplicating the content on the page, which shouldn't happen
in practice. It will work if multiple apps are rendering different named
views.

___

### meta %{#Properties-meta}%

• **meta**: [`RouteMeta`](RouteMeta.md)

{@inheritDoc _RouteRecordBase.meta}

___

### name %{#Properties-name}%

• **name**: `undefined` \| [`RouteRecordName`](../index.md#routerecordname)

{@inheritDoc _RouteRecordBase.name}

___

### path %{#Properties-path}%

• **path**: `string`

{@inheritDoc _RouteRecordBase.path}

___

### props %{#Properties-props}%

• **props**: `Record`<`string`, `_RouteRecordProps`\>

{@inheritDoc RouteRecordMultipleViews.props}

___

### redirect %{#Properties-redirect}%

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

{@inheritDoc _RouteRecordBase.redirect}
