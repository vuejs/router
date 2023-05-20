---
editLink: false
---

[API Documentation](../index.md) / RouteRecordNormalized

# Interface: RouteRecordNormalized

Normalized version of a [route record](../index.md#Type-Aliases-RouteRecord).

## Hierarchy %{#Hierarchy}%

- **`RouteRecordNormalized`**

  ↳ [`RouteLocationMatched`](RouteLocationMatched.md)

## Properties %{#Properties}%

### aliasOf %{#Properties-aliasOf}%

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

Defines if this record is the alias of another one. This property is
`undefined` if the record is the original one.

---

### beforeEnter %{#Properties-beforeEnter}%

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Registered beforeEnter guards

---

### children %{#Properties-children}%

• **children**: [`RouteRecordRaw`](../index.md#Type-Aliases-RouteRecordRaw)[]

Nested route records.

---

### components %{#Properties-components}%

• **components**: `undefined` \| `null` \| `Record`<`string`, `RawRouteComponent`\>

{@inheritDoc RouteRecordMultipleViews.components}

---

### instances %{#Properties-instances}%

• **instances**: `Record`<`string`, `undefined` \| `null` \| `ComponentPublicInstance`<{}, {}, {}, {}, {}, {}, {}, {}, `false`, `ComponentOptionsBase`<`any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, `any`, {}, {}, `string`, {}\>, {}, {}\>\>

Mounted route component instances
Having the instances on the record mean beforeRouteUpdate and
beforeRouteLeave guards can only be invoked with the latest mounted app
instance if there are multiple application instances rendering the same
view, basically duplicating the content on the page, which shouldn't happen
in practice. It will work if multiple apps are rendering different named
views.

---

### meta %{#Properties-meta}%

• **meta**: [`RouteMeta`](RouteMeta.md)

{@inheritDoc \_RouteRecordBase.meta}

---

### name %{#Properties-name}%

• **name**: `undefined` \| [`RouteRecordName`](../index.md#Type-Aliases-RouteRecordName)

{@inheritDoc \_RouteRecordBase.name}

---

### path %{#Properties-path}%

• **path**: `string`

{@inheritDoc \_RouteRecordBase.path}

---

### props %{#Properties-props}%

• **props**: `Record`<`string`, `_RouteRecordProps`\>

{@inheritDoc RouteRecordMultipleViews.props}

---

### redirect %{#Properties-redirect}%

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

{@inheritDoc \_RouteRecordBase.redirect}
