---
editLink: false
---

[API Documentation](../index.md) / RouteRecordMultipleViewsWithChildren

# Interface: RouteRecordMultipleViewsWithChildren

Route Record defining multiple named components with the `components` option and children.

## Hierarchy

- [`_RouteRecordBase`](RouteRecordBase.md)

  ↳ **`RouteRecordMultipleViewsWithChildren`**

## Properties

### alias

• `Optional` **alias**: `string` \| `string`[]

Aliases for the record. Allows defining extra paths that will behave like a
copy of the record. Allows having paths shorthands like `/users/:id` and
`/u/:id`. All `alias` and `path` values must share the same params.

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[alias](RouteRecordBase.md#alias)

___

### beforeEnter

• `Optional` **beforeEnter**: [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Before Enter guard specific to this record. Note `beforeEnter` has no
effect if the record has a `redirect` property.

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[beforeEnter](RouteRecordBase.md#beforeEnter)

___

### children

• **children**: [`RouteRecordRaw`](../index.md#RouteRecordRaw)[]

Array of nested routes.

#### Overrides

[_RouteRecordBase](RouteRecordBase.md).[children](RouteRecordBase.md#children)

___

### component

• `Optional` **component**: `undefined`

___

### components

• `Optional` **components**: ``null`` \| `Record`<`string`, `RawRouteComponent`\>

Components to display when the URL matches this route. Allow using named views.

___

### end

• `Optional` **end**: `boolean`

Should the RegExp match until the end by appending a `$` to it.

**`Default Value`**

`true`

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[end](RouteRecordBase.md#end)

___

### meta

• `Optional` **meta**: [`RouteMeta`](RouteMeta.md)

Arbitrary data attached to the record.

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[meta](RouteRecordBase.md#meta)

___

### name

• `Optional` **name**: [`RouteRecordName`](../index.md#RouteRecordName)

Name for the route record. Must be unique.

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[name](RouteRecordBase.md#name)

___

### path

• **path**: `string`

Path of the record. Should start with `/` unless the record is the child of
another record.

**`Example`**

```ts
`/users/:id` matches `/users/1` as well as `/users/posva`.
```

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[path](RouteRecordBase.md#path)

___

### props

• `Optional` **props**: `boolean` \| `Record`<`string`, `_RouteRecordProps`\>

Allow passing down params as props to the component rendered by
`router-view`. Should be an object with the same keys as `components` or a
boolean to be applied to every component.

#### Overrides

[_RouteRecordBase](RouteRecordBase.md).[props](RouteRecordBase.md#props)

___

### redirect

• `Optional` **redirect**: `RouteRecordRedirectOption`

Where to redirect if the route is directly matched. The redirection happens
before any navigation guard and triggers a new navigation with the new
target location.

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[redirect](RouteRecordBase.md#redirect)

___

### sensitive

• `Optional` **sensitive**: `boolean`

Makes the RegExp case-sensitive.

**`Default Value`**

`false`

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[sensitive](RouteRecordBase.md#sensitive)

___

### strict

• `Optional` **strict**: `boolean`

Whether to disallow a trailing slash or not.

**`Default Value`**

`false`

#### Inherited from

[_RouteRecordBase](RouteRecordBase.md).[strict](RouteRecordBase.md#strict)
