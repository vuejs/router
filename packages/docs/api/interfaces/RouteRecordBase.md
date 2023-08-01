---
editLink: false
---

[API Documentation](../index.md) / \_RouteRecordBase

# Interface: \_RouteRecordBase

Internal type for common properties among all kind of [RouteRecordRaw](../index.md#RouteRecordRaw).

## Hierarchy

- [`PathParserOptions`](../index.md#PathParserOptions)

  ↳ **`_RouteRecordBase`**

  ↳↳ [`RouteRecordSingleView`](RouteRecordSingleView.md)

  ↳↳ [`RouteRecordSingleViewWithChildren`](RouteRecordSingleViewWithChildren.md)

  ↳↳ [`RouteRecordMultipleViews`](RouteRecordMultipleViews.md)

  ↳↳ [`RouteRecordMultipleViewsWithChildren`](RouteRecordMultipleViewsWithChildren.md)

  ↳↳ [`RouteRecordRedirect`](RouteRecordRedirect.md)

## Properties

### alias

• `Optional` **alias**: `string` \| `string`[]

Aliases for the record. Allows defining extra paths that will behave like a
copy of the record. Allows having paths shorthands like `/users/:id` and
`/u/:id`. All `alias` and `path` values must share the same params.

___

### beforeEnter

• `Optional` **beforeEnter**: [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Before Enter guard specific to this record. Note `beforeEnter` has no
effect if the record has a `redirect` property.

___

### children

• `Optional` **children**: [`RouteRecordRaw`](../index.md#RouteRecordRaw)[]

Array of nested routes.

___

### end

• `Optional` **end**: `boolean`

Should the RegExp match until the end by appending a `$` to it.

**`Default Value`**

`true`

#### Inherited from

PathParserOptions.end

___

### meta

• `Optional` **meta**: [`RouteMeta`](RouteMeta.md)

Arbitrary data attached to the record.

___

### name

• `Optional` **name**: [`RouteRecordName`](../index.md#RouteRecordName)

Name for the route record. Must be unique.

___

### path

• **path**: `string`

Path of the record. Should start with `/` unless the record is the child of
another record.

**`Example`**

```ts
`/users/:id` matches `/users/1` as well as `/users/posva`.
```

___

### props

• `Optional` **props**: `_RouteRecordProps` \| `Record`<`string`, `_RouteRecordProps`\>

Allow passing down params as props to the component rendered by `router-view`.

___

### redirect

• `Optional` **redirect**: `RouteRecordRedirectOption`

Where to redirect if the route is directly matched. The redirection happens
before any navigation guard and triggers a new navigation with the new
target location.

___

### sensitive

• `Optional` **sensitive**: `boolean`

Makes the RegExp case-sensitive.

**`Default Value`**

`false`

#### Inherited from

PathParserOptions.sensitive

___

### strict

• `Optional` **strict**: `boolean`

Whether to disallow a trailing slash or not.

**`Default Value`**

`false`

#### Inherited from

PathParserOptions.strict
