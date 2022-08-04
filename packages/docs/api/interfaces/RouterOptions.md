---
sidebar: "auto"
editLinks: false
sidebarDepth: 3
---

[API Documentation](../index.md) / RouterOptions

# Interface: RouterOptions

Options to initialize a [Router](Router.md) instance.

## Hierarchy

- [`PathParserOptions`](../index.md#pathparseroptions)

  ↳ **`RouterOptions`**

## Properties

### end

• `Optional` **end**: `boolean`

Should the RegExp match until the end by appending a `$` to it.

**`Default Value`**

`true`

#### Inherited from

PathParserOptions.end

___

### history

• **history**: [`RouterHistory`](RouterHistory.md)

History implementation used by the router. Most web applications should use
`createWebHistory` but it requires the server to be properly configured.
You can also use a _hash_ based history with `createWebHashHistory` that
does not require any configuration on the server but isn't handled at all
by search engines and does poorly on SEO.

**`Example`**

```js
createRouter({
  history: createWebHistory(),
  // other options...
})
```

___

### linkActiveClass

• `Optional` **linkActiveClass**: `string`

Default class applied to active [RouterLink](../index.md#routerlink). If none is provided,
`router-link-active` will be applied.

___

### linkExactActiveClass

• `Optional` **linkExactActiveClass**: `string`

Default class applied to exact active [RouterLink](../index.md#routerlink). If none is provided,
`router-link-exact-active` will be applied.

___

### parseQuery

• `Optional` **parseQuery**: 

Custom implementation to parse a query. See its counterpart,
[stringifyQuery](RouterOptions.md#stringifyquery).

**`Example`**

Let's say you want to use the [qs package](https://github.com/ljharb/qs)
to parse queries, you can provide both `parseQuery` and `stringifyQuery`:
```js
import qs from 'qs'

createRouter({
  // other options...
  parseQuery: qs.parse,
  stringifyQuery: qs.stringify,
})
```

___

### routes

• **routes**: readonly [`RouteRecordRaw`](../index.md#routerecordraw)[]

Initial list of routes that should be added to the router.

___

### scrollBehavior

• `Optional` **scrollBehavior**: [`RouterScrollBehavior`](RouterScrollBehavior.md)

Function to control scrolling when navigating between pages. Can return a
Promise to delay scrolling. Check ScrollBehavior.

**`Example`**

```js
function scrollBehavior(to, from, savedPosition) {
  // `to` and `from` are both route locations
  // `savedPosition` can be null if there isn't one
}
```

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

___

### stringifyQuery

• `Optional` **stringifyQuery**: 

Custom implementation to stringify a query object. Should not prepend a leading `?`.
[parseQuery](RouterOptions.md#parsequery) counterpart to handle query parsing.
