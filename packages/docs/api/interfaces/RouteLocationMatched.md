---
editLink: false
---

[API Documentation](../index.md) / RouteLocationMatched

# Interface: RouteLocationMatched

Normalized version of a [route record](../index.md#RouteRecord).

## Hierarchy

- [`RouteRecordNormalized`](RouteRecordNormalized.md)

  ↳ **`RouteLocationMatched`**

## Properties

### aliasOf

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

Defines if this record is the alias of another one. This property is
`undefined` if the record is the original one.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[aliasOf](RouteRecordNormalized.md#aliasOf)

___

### beforeEnter

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Registered beforeEnter guards

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[beforeEnter](RouteRecordNormalized.md#beforeEnter)

___

### children

• **children**: [`RouteRecordRaw`](../index.md#RouteRecordRaw)[]

Nested route records.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[children](RouteRecordNormalized.md#children)

___

### components

• **components**: `undefined` \| ``null`` \| `Record`<`string`, [`RouteComponent`](../index.md#RouteComponent)\>

Components to display when the URL matches this route. Allow using named views.

#### Overrides

[RouteRecordNormalized](RouteRecordNormalized.md).[components](RouteRecordNormalized.md#components)

___

### instances

• **instances**: `Record`<`string`, `undefined` \| ``null`` \| `ComponentPublicInstance`\>

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

Arbitrary data attached to the record.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[meta](RouteRecordNormalized.md#meta)

___

### name

• **name**: `undefined` \| [`RouteRecordName`](../index.md#RouteRecordName)

Name for the route record. Must be unique.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[name](RouteRecordNormalized.md#name)

___

### path

• **path**: `string`

Path of the record. Should start with `/` unless the record is the child of
another record.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[path](RouteRecordNormalized.md#path)

___

### props

• **props**: `Record`<`string`, `_RouteRecordProps`\>

Allow passing down params as props to the component rendered by
`router-view`. Should be an object with the same keys as `components` or a
boolean to be applied to every component.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[props](RouteRecordNormalized.md#props)

___

### redirect

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

Where to redirect if the route is directly matched. The redirection happens
before any navigation guard and triggers a new navigation with the new
target location.

#### Inherited from

[RouteRecordNormalized](RouteRecordNormalized.md).[redirect](RouteRecordNormalized.md#redirect)
