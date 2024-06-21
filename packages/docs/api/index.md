---
editLink: false
---

API Documentation

# API Documentation

## Enumerations

- [ErrorTypes](enums/ErrorTypes.md)
- [NavigationFailureType](enums/NavigationFailureType.md)

## Interfaces

- [HistoryState](interfaces/HistoryState.md)
- [LocationAsRelativeRaw](interfaces/LocationAsRelativeRaw.md)
- [MatcherLocation](interfaces/MatcherLocation.md)
- [MatcherLocationAsPath](interfaces/MatcherLocationAsPath.md)
- [NavigationFailure](interfaces/NavigationFailure.md)
- [NavigationGuard](interfaces/NavigationGuard.md)
- [NavigationGuardNext](interfaces/NavigationGuardNext.md)
- [NavigationGuardWithThis](interfaces/NavigationGuardWithThis.md)
- [NavigationHookAfter](interfaces/NavigationHookAfter.md)
- [NavigationRedirectError](interfaces/NavigationRedirectError.md)
- [RouteLocationAsPathGeneric](interfaces/RouteLocationAsPathGeneric.md)
- [RouteLocationAsPathTyped](interfaces/RouteLocationAsPathTyped.md)
- [RouteLocationAsRelativeGeneric](interfaces/RouteLocationAsRelativeGeneric.md)
- [RouteLocationAsRelativeTyped](interfaces/RouteLocationAsRelativeTyped.md)
- [RouteLocationGeneric](interfaces/RouteLocationGeneric.md)
- [RouteLocationMatched](interfaces/RouteLocationMatched.md)
- [RouteLocationNamedRaw](interfaces/RouteLocationNamedRaw.md)
- [RouteLocationNormalizedGeneric](interfaces/RouteLocationNormalizedGeneric.md)
- [RouteLocationNormalizedLoadedGeneric](interfaces/RouteLocationNormalizedLoadedGeneric.md)
- [RouteLocationNormalizedLoadedTyped](interfaces/RouteLocationNormalizedLoadedTyped.md)
- [RouteLocationNormalizedTyped](interfaces/RouteLocationNormalizedTyped.md)
- [RouteLocationOptions](interfaces/RouteLocationOptions.md)
- [RouteLocationPathRaw](interfaces/RouteLocationPathRaw.md)
- [RouteLocationResolvedGeneric](interfaces/RouteLocationResolvedGeneric.md)
- [RouteLocationResolvedTyped](interfaces/RouteLocationResolvedTyped.md)
- [RouteLocationTyped](interfaces/RouteLocationTyped.md)
- [RouteMeta](interfaces/RouteMeta.md)
- [RouteQueryAndHash](interfaces/RouteQueryAndHash.md)
- [RouteRecordInfo](interfaces/RouteRecordInfo.md)
- [RouteRecordMultipleViews](interfaces/RouteRecordMultipleViews.md)
- [RouteRecordMultipleViewsWithChildren](interfaces/RouteRecordMultipleViewsWithChildren.md)
- [RouteRecordNormalized](interfaces/RouteRecordNormalized.md)
- [RouteRecordRedirect](interfaces/RouteRecordRedirect.md)
- [RouteRecordSingleView](interfaces/RouteRecordSingleView.md)
- [RouteRecordSingleViewWithChildren](interfaces/RouteRecordSingleViewWithChildren.md)
- [Router](interfaces/Router.md)
- [RouterHistory](interfaces/RouterHistory.md)
- [RouterLinkProps](interfaces/RouterLinkProps.md)
- [RouterMatcher](interfaces/RouterMatcher.md)
- [RouterOptions](interfaces/RouterOptions.md)
- [RouterScrollBehavior](interfaces/RouterScrollBehavior.md)
- [RouterViewProps](interfaces/RouterViewProps.md)
- [TypesConfig](interfaces/TypesConfig.md)
- [UseLinkOptions](interfaces/UseLinkOptions.md)
- [UseLinkReturn](interfaces/UseLinkReturn.md)
- [\_PathParserOptions](interfaces/PathParserOptions.md)
- [\_RouteLocationBase](interfaces/RouteLocationBase.md)
- [\_RouteRecordBase](interfaces/RouteRecordBase.md)
- [\_RouterLinkI](interfaces/RouterLinkI.md)

## Type Aliases

### LocationQuery

Ƭ **LocationQuery**: `Record`\<`string`, [`LocationQueryValue`](index.md#LocationQueryValue) \| [`LocationQueryValue`](index.md#LocationQueryValue)[]\>

Normalized query object that appears in [RouteLocationNormalized](index.md#RouteLocationNormalized)

___

### LocationQueryRaw

Ƭ **LocationQueryRaw**: `Record`\<`string` \| `number`, [`LocationQueryValueRaw`](index.md#LocationQueryValueRaw) \| [`LocationQueryValueRaw`](index.md#LocationQueryValueRaw)[]\>

Loose [LocationQuery](index.md#LocationQuery) object that can be passed to functions like
[Router.push](interfaces/Router.md#push) and [Router.replace](interfaces/Router.md#replace) or anywhere when creating a
[RouteLocationRaw](index.md#RouteLocationRaw)

___

### LocationQueryValue

Ƭ **LocationQueryValue**: `string` \| ``null``

Possible values in normalized [LocationQuery](index.md#LocationQuery). `null` renders the query
param but without an `=`.

**`Example`**

```
?isNull&isEmpty=&other=other
gives
`{ isNull: null, isEmpty: '', other: 'other' }`.
```

___

### LocationQueryValueRaw

Ƭ **LocationQueryValueRaw**: [`LocationQueryValue`](index.md#LocationQueryValue) \| `number` \| `undefined`

Possible values when defining a query.

___

### NavigationGuardNextCallback

Ƭ **NavigationGuardNextCallback**: (`vm`: `ComponentPublicInstance`) => `unknown`

Callback that can be passed to `next()` in `beforeRouteEnter()` guards.

#### Type declaration

▸ (`vm`): `unknown`

##### Parameters

| Name | Type |
| :------ | :------ |
| `vm` | `ComponentPublicInstance` |

##### Returns

`unknown`

___

### NavigationGuardReturn

Ƭ **NavigationGuardReturn**: `void` \| `Error` \| `boolean` \| [`RouteLocationRaw`](index.md#RouteLocationRaw)

Return types for a Navigation Guard. Based on `TypesConfig`

**`See`**

[TypesConfig](interfaces/TypesConfig.md)

___

### ParamValue

Ƭ **ParamValue**\<`isRaw`\>: ``true`` extends `isRaw` ? `string` \| `number` : `string`

Utility type for raw and non raw params like :id

#### Type parameters

| Name | Type |
| :------ | :------ |
| `isRaw` | extends `boolean` |

___

### ParamValueOneOrMore

Ƭ **ParamValueOneOrMore**\<`isRaw`\>: [[`ParamValue`](index.md#ParamValue)\<`isRaw`\>, ...ParamValue\<isRaw\>[]]

Utility type for raw and non raw params like :id+

#### Type parameters

| Name | Type |
| :------ | :------ |
| `isRaw` | extends `boolean` |

___

### ParamValueZeroOrMore

Ƭ **ParamValueZeroOrMore**\<`isRaw`\>: ``true`` extends `isRaw` ? [`ParamValue`](index.md#ParamValue)\<`isRaw`\>[] \| `undefined` \| ``null`` : [`ParamValue`](index.md#ParamValue)\<`isRaw`\>[] \| `undefined`

Utility type for raw and non raw params like :id*

#### Type parameters

| Name | Type |
| :------ | :------ |
| `isRaw` | extends `boolean` |

___

### ParamValueZeroOrOne

Ƭ **ParamValueZeroOrOne**\<`isRaw`\>: ``true`` extends `isRaw` ? `string` \| `number` \| ``null`` \| `undefined` : `string`

Utility type for raw and non raw params like :id?

#### Type parameters

| Name | Type |
| :------ | :------ |
| `isRaw` | extends `boolean` |

___

### PathParserOptions

Ƭ **PathParserOptions**: `Pick`\<[`_PathParserOptions`](interfaces/PathParserOptions.md), ``"end"`` \| ``"sensitive"`` \| ``"strict"``\>

___

### RouteComponent

Ƭ **RouteComponent**: `Component` \| `DefineComponent`

Allowed Component in [RouteLocationMatched](interfaces/RouteLocationMatched.md)

___

### RouteLocation

Ƭ **RouteLocation**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteLocationGeneric`](interfaces/RouteLocationGeneric.md) : [`RouteLocationTypedList`](index.md#RouteLocationTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`]

[RouteLocationRaw](index.md#RouteLocationRaw) resolved using the matcher

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationAsPath

Ƭ **RouteLocationAsPath**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteLocationAsPathGeneric`](interfaces/RouteLocationAsPathGeneric.md) : [`RouteLocationAsPathTypedList`](index.md#RouteLocationAsPathTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`]

Route location as an object with a `path` property.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationAsPathTypedList

Ƭ **RouteLocationAsPathTypedList**\<`RouteMap`\>: \{ [N in keyof RouteMap]: RouteLocationAsPathTyped\<RouteMap, N\> }

List of all possible [RouteLocationAsPath](index.md#RouteLocationAsPath) indexed by the route name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |

___

### RouteLocationAsRelative

Ƭ **RouteLocationAsRelative**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteLocationAsRelativeGeneric`](interfaces/RouteLocationAsRelativeGeneric.md) : [`RouteLocationAsRelativeTypedList`](index.md#RouteLocationAsRelativeTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`]

Route location relative to the current location. It accepts other properties than `path` like `params`, `query` and
`hash` to conveniently change them.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationAsRelativeTypedList

Ƭ **RouteLocationAsRelativeTypedList**\<`RouteMap`\>: \{ [N in keyof RouteMap]: RouteLocationAsRelativeTyped\<RouteMap, N\> }

List of all possible [RouteLocationAsRelative](index.md#RouteLocationAsRelative) indexed by the route name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |

___

### RouteLocationAsString

Ƭ **RouteLocationAsString**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? `string` : `_LiteralUnion`\<[`RouteLocationAsStringTypedList`](index.md#RouteLocationAsStringTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`], `string`\>

Same as [RouteLocationAsPath](index.md#RouteLocationAsPath) but as a string literal.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationAsStringTyped

Ƭ **RouteLocationAsStringTyped**\<`RouteMap`, `Name`\>: `RouteMap`[`Name`][``"path"``]

Helper to generate a type safe version of the [RouteLocationAsString](index.md#RouteLocationAsString) type.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |
| `Name` | extends keyof `RouteMap` = keyof `RouteMap` |

___

### RouteLocationAsStringTypedList

Ƭ **RouteLocationAsStringTypedList**\<`RouteMap`\>: \{ [N in keyof RouteMap]: RouteLocationAsStringTyped\<RouteMap, N\> }

List of all possible [RouteLocationAsString](index.md#RouteLocationAsString) indexed by the route name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |

___

### RouteLocationNormalized

Ƭ **RouteLocationNormalized**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteLocationNormalizedGeneric`](interfaces/RouteLocationNormalizedGeneric.md) : [`RouteLocationNormalizedTypedList`](index.md#RouteLocationNormalizedTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`]

Similar to [RouteLocation](index.md#RouteLocation) but its
[`matched` property](interfaces/RouteLocationNormalizedTyped.md#matched) cannot contain redirect records

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationNormalizedLoaded

Ƭ **RouteLocationNormalizedLoaded**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteLocationNormalizedLoadedGeneric`](interfaces/RouteLocationNormalizedLoadedGeneric.md) : [`RouteLocationNormalizedLoadedTypedList`](index.md#RouteLocationNormalizedLoadedTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`]

Similar to [RouteLocationNormalized](index.md#RouteLocationNormalized) but its `components` do not contain any function to lazy load components.
In other words, it's ready to be rendered by `<RouterView>`.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationNormalizedLoadedTypedList

Ƭ **RouteLocationNormalizedLoadedTypedList**\<`RouteMap`\>: \{ [N in keyof RouteMap]: RouteLocationNormalizedLoadedTyped\<RouteMap, N\> }

List of all possible [RouteLocationNormalizedLoaded](index.md#RouteLocationNormalizedLoaded) indexed by the route name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |

___

### RouteLocationNormalizedTypedList

Ƭ **RouteLocationNormalizedTypedList**\<`RouteMap`\>: \{ [N in keyof RouteMap]: RouteLocationNormalizedTyped\<RouteMap, N\> }

List of all possible [RouteLocationNormalized](index.md#RouteLocationNormalized) indexed by the route name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |

___

### RouteLocationRaw

Ƭ **RouteLocationRaw**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteLocationAsString`](index.md#RouteLocationAsString) \| [`RouteLocationAsRelativeGeneric`](interfaces/RouteLocationAsRelativeGeneric.md) \| [`RouteLocationAsPathGeneric`](interfaces/RouteLocationAsPathGeneric.md) : `_LiteralUnion`\<[`RouteLocationAsStringTypedList`](index.md#RouteLocationAsStringTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`], `string`\> \| [`RouteLocationAsRelativeTypedList`](index.md#RouteLocationAsRelativeTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`] \| [`RouteLocationAsPathTypedList`](index.md#RouteLocationAsPathTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`]

Route location that can be passed to `router.push()` and other user-facing APIs.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationResolved

Ƭ **RouteLocationResolved**\<`Name`\>: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteLocationResolvedGeneric`](interfaces/RouteLocationResolvedGeneric.md) : [`RouteLocationResolvedTypedList`](index.md#RouteLocationResolvedTypedList)\<[`RouteMap`](index.md#RouteMap)\>[`Name`]

Route location resolved with [`router.resolve()`](interfaces/Router.md).

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteLocationResolvedTypedList

Ƭ **RouteLocationResolvedTypedList**\<`RouteMap`\>: \{ [N in keyof RouteMap]: RouteLocationResolvedTyped\<RouteMap, N\> }

List of all possible [RouteLocationResolved](index.md#RouteLocationResolved) indexed by the route name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |

___

### RouteLocationTypedList

Ƭ **RouteLocationTypedList**\<`RouteMap`\>: \{ [N in keyof RouteMap]: RouteLocationTyped\<RouteMap, N\> }

List of all possible [RouteLocation](index.md#RouteLocation) indexed by the route name.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RouteMap` | extends [`RouteMapGeneric`](index.md#RouteMapGeneric) = [`RouteMapGeneric`](index.md#RouteMapGeneric) |

___

### RouteMap

Ƭ **RouteMap**: [`TypesConfig`](interfaces/TypesConfig.md) extends `Record`\<``"RouteNamedMap"``, infer RouteNamedMap\> ? `RouteNamedMap` : [`RouteMapGeneric`](index.md#RouteMapGeneric)

Convenience type to get the typed RouteMap or a generic one if not provided. It is extracted from the [TypesConfig](interfaces/TypesConfig.md) if it exists, it becomes [RouteMapGeneric](index.md#RouteMapGeneric) otherwise.

___

### RouteMapGeneric

Ƭ **RouteMapGeneric**: `Record`\<`string` \| `symbol`, [`RouteRecordInfo`](interfaces/RouteRecordInfo.md)\>

Generic version of the `RouteMap`.

___

### RouteParamValue

Ƭ **RouteParamValue**: `string`

___

### RouteParamValueRaw

Ƭ **RouteParamValueRaw**: [`RouteParamValue`](index.md#RouteParamValue) \| `number` \| ``null`` \| `undefined`

___

### RouteParams

Ƭ **RouteParams**\<`Name`\>: [`RouteMap`](index.md#RouteMap)[`Name`][``"params"``]

Generate a type safe params for a route location. Requires the name of the route to be passed as a generic.

**`See`**

[RouteParamsGeneric](index.md#RouteParamsGeneric)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteParamsGeneric

Ƭ **RouteParamsGeneric**: `Record`\<`string`, [`RouteParamValue`](index.md#RouteParamValue) \| [`RouteParamValue`](index.md#RouteParamValue)[]\>

___

### RouteParamsRaw

Ƭ **RouteParamsRaw**\<`Name`\>: [`RouteMap`](index.md#RouteMap)[`Name`][``"paramsRaw"``]

Generate a type safe raw params for a route location. Requires the name of the route to be passed as a generic.

**`See`**

[RouteParamsRaw](index.md#RouteParamsRaw)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

___

### RouteParamsRawGeneric

Ƭ **RouteParamsRawGeneric**: `Record`\<`string`, [`RouteParamValueRaw`](index.md#RouteParamValueRaw) \| `Exclude`\<[`RouteParamValueRaw`](index.md#RouteParamValueRaw), ``null`` \| `undefined`\>[]\>

___

### RouteRecord

Ƭ **RouteRecord**: [`RouteRecordNormalized`](interfaces/RouteRecordNormalized.md)

Normalized version of a [route record](index.md#RouteRecord).

___

### RouteRecordName

Ƭ **RouteRecordName**: [`RouteMapGeneric`](index.md#RouteMapGeneric) extends [`RouteMap`](index.md#RouteMap) ? [`RouteRecordNameGeneric`](index.md#RouteRecordNameGeneric) : keyof [`RouteMap`](index.md#RouteMap)

Possible values for a route record **after normalization**

NOTE: since `RouteRecordName` is a type, it evaluates too early and it's often the generic version [RouteRecordNameGeneric](index.md#RouteRecordNameGeneric). If you need a typed version of all of the names of routes, use [`keyof RouteMap`](index.md#RouteMap)

___

### RouteRecordNameGeneric

Ƭ **RouteRecordNameGeneric**: `string` \| `symbol` \| `undefined`

Generic version of [RouteRecordName](index.md#RouteRecordName).

___

### RouteRecordRaw

Ƭ **RouteRecordRaw**: [`RouteRecordSingleView`](interfaces/RouteRecordSingleView.md) \| [`RouteRecordSingleViewWithChildren`](interfaces/RouteRecordSingleViewWithChildren.md) \| [`RouteRecordMultipleViews`](interfaces/RouteRecordMultipleViews.md) \| [`RouteRecordMultipleViewsWithChildren`](interfaces/RouteRecordMultipleViewsWithChildren.md) \| [`RouteRecordRedirect`](interfaces/RouteRecordRedirect.md)

___

### RouteRecordRedirectOption

Ƭ **RouteRecordRedirectOption**: [`RouteLocationRaw`](index.md#RouteLocationRaw) \| (`to`: [`RouteLocation`](index.md#RouteLocation)) => [`RouteLocationRaw`](index.md#RouteLocationRaw)

___

### \_Awaitable

Ƭ **\_Awaitable**\<`T`\>: `T` \| `PromiseLike`\<`T`\>

Maybe a promise maybe not

#### Type parameters

| Name |
| :------ |
| `T` |

___

### \_RouteRecordProps

Ƭ **\_RouteRecordProps**\<`Name`\>: `boolean` \| `Record`\<`string`, `any`\> \| (`to`: [`RouteLocationNormalized`](index.md#RouteLocationNormalized)\<`Name`\>) => `Record`\<`string`, `any`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends keyof [`RouteMap`](index.md#RouteMap) = keyof [`RouteMap`](index.md#RouteMap) |

## Variables

### RouterLink

• `Const` **RouterLink**: [`_RouterLinkI`](interfaces/RouterLinkI.md)

Component to render a link that triggers a navigation on click.

___

### RouterView

• `Const` **RouterView**: () => \{ `$props`: `AllowedComponentProps` & `ComponentCustomProps` & `VNodeProps` & [`RouterViewProps`](interfaces/RouterViewProps.md) ; `$slots`: \{ `default?`: (`__namedParameters`: \{ `Component`: `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\> ; `route`: [`RouteLocationNormalizedLoadedGeneric`](interfaces/RouteLocationNormalizedLoadedGeneric.md)  }) => `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\>[]  }  }

Component to display the current route the user is at.

#### Type declaration

• **new RouterView**(): `Object`

Component to display the current route the user is at.

##### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `$props` | `AllowedComponentProps` & `ComponentCustomProps` & `VNodeProps` & [`RouterViewProps`](interfaces/RouterViewProps.md) |
| `$slots` | \{ `default?`: (`__namedParameters`: \{ `Component`: `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\> ; `route`: [`RouteLocationNormalizedLoadedGeneric`](interfaces/RouteLocationNormalizedLoadedGeneric.md)  }) => `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\>[]  } |
| `$slots.default?` | (`__namedParameters`: \{ `Component`: `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\> ; `route`: [`RouteLocationNormalizedLoadedGeneric`](interfaces/RouteLocationNormalizedLoadedGeneric.md)  }) => `VNode`\<`RendererNode`, `RendererElement`, \{ `[key: string]`: `any`;  }\>[] |

___

### START\_LOCATION

• `Const` **START\_LOCATION**: [`RouteLocationNormalizedLoaded`](index.md#RouteLocationNormalizedLoaded)

Initial route location where the router is. Can be used in navigation guards
to differentiate the initial navigation.

**`Example`**

```js
import { START_LOCATION } from 'vue-router'

router.beforeEach((to, from) => {
  if (from === START_LOCATION) {
    // initial navigation
  }
})
```

___

### matchedRouteKey

• `Const` **matchedRouteKey**: `InjectionKey`\<`ComputedRef`\<`undefined` \| [`RouteRecordNormalized`](interfaces/RouteRecordNormalized.md)\>\>

RouteRecord being rendered by the closest ancestor Router View. Used for
`onBeforeRouteUpdate` and `onBeforeRouteLeave`. rvlm stands for Router View
Location Matched

___

### routeLocationKey

• `Const` **routeLocationKey**: `InjectionKey`\<[`RouteLocationNormalizedLoadedGeneric`](interfaces/RouteLocationNormalizedLoadedGeneric.md)\>

Allows overriding the current route returned by `useRoute` in tests. rl
stands for route location

___

### routerKey

• `Const` **routerKey**: `InjectionKey`\<[`Router`](interfaces/Router.md)\>

Allows overriding the router instance returned by `useRouter` in tests. r
stands for router

___

### routerViewLocationKey

• `Const` **routerViewLocationKey**: `InjectionKey`\<`Ref`\<[`RouteLocationNormalizedLoadedGeneric`](interfaces/RouteLocationNormalizedLoadedGeneric.md)\>\>

Allows overriding the current route used by router-view. Internally this is
used when the `route` prop is passed.

___

### viewDepthKey

• `Const` **viewDepthKey**: `InjectionKey`\<`number` \| `Ref`\<`number`\>\>

Allows overriding the router view depth to control which component in
`matched` is rendered. rvd stands for Router View Depth

## Functions

### createMemoryHistory

▸ **createMemoryHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

Creates an in-memory based history. The main purpose of this history is to handle SSR. It starts in a special location that is nowhere.
It's up to the user to replace that location with the starter location by either calling `router.push` or `router.replace`.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `base` | `string` | `''` | Base applied to all urls, defaults to '/' |

#### Returns

[`RouterHistory`](interfaces/RouterHistory.md)

a history object that can be passed to the router constructor

___

### createRouter

▸ **createRouter**(`options`): [`Router`](interfaces/Router.md)

Creates a Router instance that can be used by a Vue app.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`RouterOptions`](interfaces/RouterOptions.md) | [RouterOptions](interfaces/RouterOptions.md) |

#### Returns

[`Router`](interfaces/Router.md)

___

### createRouterMatcher

▸ **createRouterMatcher**(`routes`, `globalOptions`): [`RouterMatcher`](interfaces/RouterMatcher.md)

Creates a Router Matcher.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `routes` | readonly [`RouteRecordRaw`](index.md#RouteRecordRaw)[] | array of initial routes |
| `globalOptions` | [`PathParserOptions`](index.md#PathParserOptions) | global route options |

#### Returns

[`RouterMatcher`](interfaces/RouterMatcher.md)

___

### createWebHashHistory

▸ **createWebHashHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

Creates a hash history. Useful for web applications with no host (e.g. `file://`) or when configuring a server to
handle any URL is not possible.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `base?` | `string` | optional base to provide. Defaults to `location.pathname + location.search` If there is a `<base>` tag in the `head`, its value will be ignored in favor of this parameter **but note it affects all the history.pushState() calls**, meaning that if you use a `<base>` tag, it's `href` value **has to match this parameter** (ignoring anything after the `#`). |

#### Returns

[`RouterHistory`](interfaces/RouterHistory.md)

**`Example`**

```js
// at https://example.com/folder
createWebHashHistory() // gives a url of `https://example.com/folder#`
createWebHashHistory('/folder/') // gives a url of `https://example.com/folder/#`
// if the `#` is provided in the base, it won't be added by `createWebHashHistory`
createWebHashHistory('/folder/#/app/') // gives a url of `https://example.com/folder/#/app/`
// you should avoid doing this because it changes the original url and breaks copying urls
createWebHashHistory('/other-folder/') // gives a url of `https://example.com/other-folder/#`

// at file:///usr/etc/folder/index.html
// for locations with no `host`, the base is ignored
createWebHashHistory('/iAmIgnored') // gives a url of `file:///usr/etc/folder/index.html#`
```

___

### createWebHistory

▸ **createWebHistory**(`base?`): [`RouterHistory`](interfaces/RouterHistory.md)

Creates an HTML5 history. Most common history for single page applications.

#### Parameters

| Name | Type |
| :------ | :------ |
| `base?` | `string` |

#### Returns

[`RouterHistory`](interfaces/RouterHistory.md)

___

### isNavigationFailure

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationRedirectError

Check if an object is a [NavigationFailure](interfaces/NavigationFailure.md).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `any` | possible [NavigationFailure](interfaces/NavigationFailure.md) |
| `type?` | [`NAVIGATION_GUARD_REDIRECT`](enums/ErrorTypes.md#NAVIGATION_GUARD_REDIRECT) | optional types to check for |

#### Returns

error is NavigationRedirectError

**`Example`**

```js
import { isNavigationFailure, NavigationFailureType } from 'vue-router'

router.afterEach((to, from, failure) => {
  // Any kind of navigation failure
  if (isNavigationFailure(failure)) {
    // ...
  }
  // Only duplicated navigations
  if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    // ...
  }
  // Aborted or canceled navigations
  if (isNavigationFailure(failure, NavigationFailureType.aborted | NavigationFailureType.canceled)) {
    // ...
  }
})
```

▸ **isNavigationFailure**(`error`, `type?`): error is NavigationFailure

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `any` |
| `type?` | [`ErrorTypes`](enums/ErrorTypes.md) \| [`NavigationFailureType`](enums/NavigationFailureType.md) |

#### Returns

error is NavigationFailure

___

### loadRouteLocation

▸ **loadRouteLocation**(`route`): `Promise`\<[`RouteLocationNormalizedLoaded`](index.md#RouteLocationNormalizedLoaded)\>

Ensures a route is loaded, so it can be passed as o prop to `<RouterView>`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `route` | [`RouteLocationNormalizedGeneric`](interfaces/RouteLocationNormalizedGeneric.md) \| [`RouteLocationGeneric`](interfaces/RouteLocationGeneric.md) | resolved route to load |

#### Returns

`Promise`\<[`RouteLocationNormalizedLoaded`](index.md#RouteLocationNormalizedLoaded)\>

___

### onBeforeRouteLeave

▸ **onBeforeRouteLeave**(`leaveGuard`): `void`

Add a navigation guard that triggers whenever the component for the current
location is about to be left. Similar to beforeRouteLeave but can be
used in any component. The guard is removed when the component is unmounted.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `leaveGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### Returns

`void`

___

### onBeforeRouteUpdate

▸ **onBeforeRouteUpdate**(`updateGuard`): `void`

Add a navigation guard that triggers whenever the current location is about
to be updated. Similar to beforeRouteUpdate but can be used in any
component. The guard is removed when the component is unmounted.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `updateGuard` | [`NavigationGuard`](interfaces/NavigationGuard.md) | [NavigationGuard](interfaces/NavigationGuard.md) |

#### Returns

`void`

___

### parseQuery

▸ **parseQuery**(`search`): [`LocationQuery`](index.md#LocationQuery)

Transforms a queryString into a [LocationQuery](index.md#LocationQuery) object. Accept both, a
version with the leading `?` and without Should work as URLSearchParams

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `search` | `string` | search string to parse |

#### Returns

[`LocationQuery`](index.md#LocationQuery)

a query object

___

### stringifyQuery

▸ **stringifyQuery**(`query`): `string`

Stringifies a [LocationQueryRaw](index.md#LocationQueryRaw) object. Like `URLSearchParams`, it
doesn't prepend a `?`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `query` | [`LocationQueryRaw`](index.md#LocationQueryRaw) | query object to stringify |

#### Returns

`string`

string version of the query without the leading `?`

___

### useLink

▸ **useLink**\<`Name`\>(`props`): [`UseLinkReturn`](interfaces/UseLinkReturn.md)\<`Name`\>

Returns the internal behavior of a [RouterLink](index.md#RouterLink) without the rendering part.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends `string` \| `symbol` = `string` \| `symbol` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`UseLinkOptions`](interfaces/UseLinkOptions.md)\<`Name`\> | a `to` location and an optional `replace` flag |

#### Returns

[`UseLinkReturn`](interfaces/UseLinkReturn.md)\<`Name`\>

___

### useRoute

▸ **useRoute**\<`Name`\>(`_name?`): [`RouteLocationNormalizedLoaded`](index.md#RouteLocationNormalizedLoaded)\<`Name`\>

Returns the current route location. Equivalent to using `$route` inside
templates.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Name` | extends `string` \| `symbol` = `string` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `_name?` | `Name` |

#### Returns

[`RouteLocationNormalizedLoaded`](index.md#RouteLocationNormalizedLoaded)\<`Name`\>

___

### useRouter

▸ **useRouter**(): [`Router`](interfaces/Router.md)

Returns the router instance. Equivalent to using `$router` inside
templates.

#### Returns

[`Router`](interfaces/Router.md)
