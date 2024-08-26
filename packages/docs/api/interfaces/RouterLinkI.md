---
editLink: false
---

[API Documentation](../index.md) / \_RouterLinkI

# Interface: \_RouterLinkI

Typed version of the `RouterLink` component. Its generic defaults to the typed router, so it can be inferred
automatically for JSX.

## Constructors

### constructor

• **new _RouterLinkI**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `$props` | `AllowedComponentProps` & `ComponentCustomProps` & `VNodeProps` & [`RouterLinkProps`](RouterLinkProps.md) |
| `$slots` | \{ `default?`: (`__namedParameters`: \{ `href`: `string` ; `isActive`: `boolean` ; `isExactActive`: `boolean` ; `route`: [`RouteLocationResolvedGeneric`](RouteLocationResolvedGeneric.md) ; `navigate`: (`e?`: `MouseEvent`) => `Promise`\<`void` \| [`NavigationFailure`](NavigationFailure.md)\>  }) => `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\>[]  } |
| `$slots.default?` | (`__namedParameters`: \{ `href`: `string` ; `isActive`: `boolean` ; `isExactActive`: `boolean` ; `route`: [`RouteLocationResolvedGeneric`](RouteLocationResolvedGeneric.md) ; `navigate`: (`e?`: `MouseEvent`) => `Promise`\<`void` \| [`NavigationFailure`](NavigationFailure.md)\>  }) => `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\>[] |

## Properties

### useLink

• **useLink**: \<Name\>(`props`: [`UseLinkOptions`](UseLinkOptions.md)\<`Name`\>) => [`UseLinkReturn`](UseLinkReturn.md)\<`Name`\>

Access to `useLink()` without depending on using vue-router

#### Type declaration

▸ \<`Name`\>(`props`): [`UseLinkReturn`](UseLinkReturn.md)\<`Name`\>

Access to `useLink()` without depending on using vue-router

##### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends `string` \| `symbol` = `string` \| `symbol` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `props` | [`UseLinkOptions`](UseLinkOptions.md)\<`Name`\> |

##### Returns

[`UseLinkReturn`](UseLinkReturn.md)\<`Name`\>
