---
sidebar: "auto"
editLinks: false
sidebarDepth: 3
---

[API Documentation](../index.md) / RouteLocationMatched

# Interface: RouteLocationMatched

Normalized version of a [route record](../index.md#routerecord).

## Hierarchy

- [`RouteRecordNormalized`](RouteRecordNormalized.md)

  ↳ **`RouteLocationMatched`**

## Properties

### aliasOf

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

Defines if this record is the alias of another one. This property is
`undefined` if the record is the original one.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[aliasOf](RouteRecordNormalized.md#aliasof)

___

### beforeEnter

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Registered beforeEnter guards

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[beforeEnter](RouteRecordNormalized.md#beforeenter)

___

### children

• **children**: [`RouteRecordRaw`](../index.md#routerecordraw)[]

Nested route records.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[children](RouteRecordNormalized.md#children)

___

### components

• **components**: `undefined` \| ``null`` \| `Record`<`string`, [`RouteComponent`](../index.md#routecomponent)\>

{@inheritDoc RouteRecordMultipleViews.components}

#### Overrides

[RouteRecordNormalized](RouteRecordNormalized.md).[components](RouteRecordNormalized.md#components)

___

### instances

• **instances**: `Record`<`string`, `undefined` \| ``null`` \| `ComponentPublicInstance`<{}, {}, {}, {}, {}, {}, {}, {}, ``false``, `ComponentOptionsBase`<`any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, {}, {}, `string`\>, {}\>\>

Mounted route component instances
Having the instances on the record mean beforeRouteUpdate and
beforeRouteLeave guards can only be invoked with the latest mounted app
instance if there are multiple application instances rendering the same
view, basically duplicating the content on the page, which shouldn't happen
in practice. It will work if multiple apps are rendering different named
views.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[instances](RouteRecordNormalized.md#instances)

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

{@inheritDoc _RouteRecordBase.meta}

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[meta](RouteRecordNormalized.md#meta)

___

### name

• **name**: `undefined` \| [`RouteRecordName`](../index.md#routerecordname)

{@inheritDoc _RouteRecordBase.name}

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[name](RouteRecordNormalized.md#name)

___

### path

• **path**: `string`

{@inheritDoc _RouteRecordBase.path}

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[path](RouteRecordNormalized.md#path)

___

### props

• **props**: `Record`<`string`, `_RouteRecordProps`\>

{@inheritDoc RouteRecordMultipleViews.props}

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[props](RouteRecordNormalized.md#props)

___

### redirect

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

{@inheritDoc _RouteRecordBase.redirect}

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[redirect](RouteRecordNormalized.md#redirect)
