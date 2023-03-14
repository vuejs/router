---
editLink: false
---

[API Documentation](../index.md) / RouterHistory

# Interface: RouterHistory

Interface implemented by History implementations that can be passed to the
router as Router.history

## Properties %{#Properties}%

### base %{#Properties-base}%

• `Readonly` **base**: `string`

Base path that is prepended to every url. This allows hosting an SPA at a
sub-folder of a domain like `example.com/sub-folder` by having a `base` of
`/sub-folder`

___

### location %{#Properties-location}%

• `Readonly` **location**: `string`

Current History location

___

### state %{#Properties-state}%

• `Readonly` **state**: [`HistoryState`](HistoryState.md)

Current History state

## Methods %{#Methods}%

### createHref %{#Methods-createHref}%

▸ **createHref**(`location`): `string`

Generates the corresponding href to be used in an anchor tag.

#### Parameters %{#Methods-createHref-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `location` | `string` | history location that should create an href |

#### Returns %{#Methods-createHref-Returns}%

`string`

___

### destroy %{#Methods-destroy}%

▸ **destroy**(): `void`

Clears any event listener attached by the history implementation.

#### Returns %{#Methods-destroy-Returns}%

`void`

___

### go %{#Methods-go}%

▸ **go**(`delta`, `triggerListeners?`): `void`

Traverses history in a given direction.

**`Example`**

```js
myHistory.go(-1) // equivalent to window.history.back()
myHistory.go(1) // equivalent to window.history.forward()
```

#### Parameters %{#Methods-go-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `delta` | `number` | distance to travel. If delta is \< 0, it will go back, if it's \> 0, it will go forward by that amount of entries. |
| `triggerListeners?` | `boolean` | whether this should trigger listeners attached to the history |

#### Returns %{#Methods-go-Returns}%

`void`

___

### listen %{#Methods-listen}%

▸ **listen**(`callback`): () => `void`

Attach a listener to the History implementation that is triggered when the
navigation is triggered from outside (like the Browser back and forward
buttons) or when passing `true` to RouterHistory.back and
RouterHistory.forward

#### Parameters %{#Methods-listen-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `callback` | `NavigationCallback` | listener to attach |

#### Returns %{#Methods-listen-Returns}%

`fn`

a callback to remove the listener

▸ (): `void`

Attach a listener to the History implementation that is triggered when the
navigation is triggered from outside (like the Browser back and forward
buttons) or when passing `true` to RouterHistory.back and
RouterHistory.forward

##### Returns %{#Methods-listen-Returns-Returns}%

`void`

a callback to remove the listener

___

### push %{#Methods-push}%

▸ **push**(`to`, `data?`): `void`

Navigates to a location. In the case of an HTML5 History implementation,
this will call `history.pushState` to effectively change the URL.

#### Parameters %{#Methods-push-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | `string` | location to push |
| `data?` | [`HistoryState`](HistoryState.md) | optional [HistoryState](HistoryState.md) to be associated with the navigation entry |

#### Returns %{#Methods-push-Returns}%

`void`

___

### replace %{#Methods-replace}%

▸ **replace**(`to`, `data?`): `void`

Same as [push](RouterHistory.md#push) but performs a `history.replaceState`
instead of `history.pushState`

#### Parameters %{#Methods-replace-Parameters}%

| Name | Type | Description |
| :------ | :------ | :------ |
| `to` | `string` | location to set |
| `data?` | [`HistoryState`](HistoryState.md) | optional [HistoryState](HistoryState.md) to be associated with the navigation entry |

#### Returns %{#Methods-replace-Returns}%

`void`
