---
sidebar: "auto"
editLinks: false
sidebarDepth: 3
---

[API Documentation](../index.md) / RouteRecordNormalized

# Interface: RouteRecordNormalized

Normalized version of a [route record](../index.md#routerecord).

## Hierarchy

- **`RouteRecordNormalized`**

  ↳ [`RouteLocationMatched`](RouteLocationMatched.md)

## Properties

### aliasOf

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

Defines if this record is the alias of another one. This property is
`undefined` if the record is the original one.

___

### beforeEnter

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Registered beforeEnter guards

___

### children

• **children**: [`RouteRecordRaw`](../index.md#routerecordraw)[]

Nested route records.

___

### components

• **components**: `undefined` \| ``null`` \| `Record`<`string`, `RawRouteComponent`\>

{@inheritDoc RouteRecordMultipleViews.components}

___

### instances

• **instances**: `Record`<`string`, `undefined` \| ``null`` \| `ComponentPublicInstance`<{}, {}, {}, {}, {}, {}, {}, {}, ``false``, `ComponentOptionsBase`<`any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, {}\>\>\>

Mounted route component instances
Having the instances on the record mean beforeRouteUpdate and
beforeRouteLeave guards can only be invoked with the latest mounted app
instance if there are multiple application instances rendering the same
view, basically duplicating the content on the page, which shouldn't happen
in practice. It will work if multiple apps are rendering different named
views.

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

{@inheritDoc _RouteRecordBase.meta}

___

### name

• **name**: `undefined` \| [`RouteRecordName`](../index.md#routerecordname)

{@inheritDoc _RouteRecordBase.name}

___

### path

• **path**: `string`

{@inheritDoc _RouteRecordBase.path}

___

### props

• **props**: `Record`<`string`, `_RouteRecordProps`\>

{@inheritDoc RouteRecordMultipleViews.props}

___

### redirect

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

{@inheritDoc _RouteRecordBase.redirect}
