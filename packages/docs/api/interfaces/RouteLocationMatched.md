---
editLink: false
---

[API Documentation](../index.md) / RouteLocationMatched

# Interface: RouteLocationMatched

Normalized version of a [route record](../index.md#Type-Aliases-RouteRecord).

## Hierarchy %{#Hierarchy}%

- [`RouteRecordNormalized`](RouteRecordNormalized.md)

  ↳ **`RouteLocationMatched`**

## Properties %{#Properties}%

### aliasOf %{#Properties-aliasOf}%

• **aliasOf**: `undefined` \| [`RouteRecordNormalized`](RouteRecordNormalized.md)

Defines if this record is the alias of another one. This property is
`undefined` if the record is the original one.

#### Inherited from %{#Properties-aliasOf-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[aliasOf](RouteRecordNormalized.md#aliasof)

---

### beforeEnter %{#Properties-beforeEnter}%

• **beforeEnter**: `undefined` \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\> \| [`NavigationGuardWithThis`](NavigationGuardWithThis.md)<`undefined`\>[]

Registered beforeEnter guards

#### Inherited from %{#Properties-beforeEnter-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[beforeEnter](RouteRecordNormalized.md#beforeenter)

---

### children %{#Properties-children}%

• **children**: [`RouteRecordRaw`](../index.md#Type-Aliases-RouteRecordRaw)[]

Nested route records.

#### Inherited from %{#Properties-children-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[children](RouteRecordNormalized.md#children)

---

### components %{#Properties-components}%

• **components**: `undefined` \| `null` \| `Record`<`string`, [`RouteComponent`](../index.md#Type-Aliases-RouteComponent)\>

{@inheritDoc RouteRecordMultipleViews.components}

#### Overrides %{#Properties-components-Overrides}%

[RouteRecordNormalized](RouteRecordNormalized.md).[components](RouteRecordNormalized.md#components)

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

#### Inherited from %{#Properties-instances-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[instances](RouteRecordNormalized.md#instances)

---

### meta %{#Properties-meta}%

• **meta**: [`RouteMeta`](RouteMeta.md)

{@inheritDoc \_RouteRecordBase.meta}

#### Inherited from %{#Properties-meta-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[meta](RouteRecordNormalized.md#meta)

---

### name %{#Properties-name}%

• **name**: `undefined` \| [`RouteRecordName`](../index.md#Type-Aliases-RouteRecordName)

{@inheritDoc \_RouteRecordBase.name}

#### Inherited from %{#Properties-name-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[name](RouteRecordNormalized.md#name)

---

### path %{#Properties-path}%

• **path**: `string`

{@inheritDoc \_RouteRecordBase.path}

#### Inherited from %{#Properties-path-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[path](RouteRecordNormalized.md#path)

---

### props %{#Properties-props}%

• **props**: `Record`<`string`, `_RouteRecordProps`\>

{@inheritDoc RouteRecordMultipleViews.props}

#### Inherited from %{#Properties-props-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[props](RouteRecordNormalized.md#props)

---

### redirect %{#Properties-redirect}%

• **redirect**: `undefined` \| `RouteRecordRedirectOption`

{@inheritDoc \_RouteRecordBase.redirect}

#### Inherited from %{#Properties-redirect-Inherited-from}%

[RouteRecordNormalized](RouteRecordNormalized.md).[redirect](RouteRecordNormalized.md#redirect)
