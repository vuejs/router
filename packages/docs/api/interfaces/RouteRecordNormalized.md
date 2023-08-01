---
editLink: false
---

[API Documentation](../index.md) / RouteRecordNormalized

# Interface: RouteRecordNormalized

Normalized version of a [route record](../index.md#RouteRecord).

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

• **children**: [`RouteRecordRaw`](../index.md#RouteRecordRaw)[]

Nested route records.

___

### components

• **components**: `undefined` \| ``null`` \| `Record`<`string`, `RawRouteComponent`\>

Components to display when the URL matches this route. Allow using named views.

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

___

### meta

• **meta**: [`RouteMeta`](RouteMeta.md)

Arbitrary data attached to the record.

___

### name

• **name**: `undefined` \| [`RouteRecordName`](../index.md#RouteRecordName)

Name for the route record. Must be unique.

___

### path

• **path**: `string`

Path of the record. Should start with `/` unless the record is the child of
another record.

___

### props

• **props**: `Record`<`string`, `_RouteRecordProps`\>

Allow passing down params as props to the component rendered by
`router-view`. Should be an object with the same keys as `components` or a
boolean to be applied to every component.

___

### redirect

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

Where to redirect if the route is directly matched. The redirection happens
before any navigation guard and triggers a new navigation with the new
target location.
