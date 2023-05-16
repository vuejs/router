---
editLink: false
---

[API 参考](../index.md) / RouterHistory

# 接口：RouterHistory

由 History 实现的接口，可以作为 Router.history 传递给路由器。

## 属性 %{#Properties}%

### base %{#Properties-base}%

• `只读` **base**: `string`

基准路径，它被预置到每个 URL 上。这允许在一个域名子文件夹中托管 SPA，例如将 `base` 设置为 `/sub-folder` 使得其托管在 `example.com/sub-folder`。

___

### location %{#Properties-location}%

• `只读` **location**: `string`

当前历史的地址

___

### state %{#Properties-state}%

• `只读` **state**: [`HistoryState`](HistoryState.md)

当前历史的状态

## Methods %{#Methods}%

### createHref %{#Methods-createHref}%

▸ **createHref**(`location`): `string`

生成用于链接标签的相应的 href。

#### 参数 %{#Methods-createHref-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `location` | `string` | 应该创建一个 href 的历史的地址 |

#### 返回值 %{#Methods-createHref-Returns}%

`string`

___

### destroy %{#Methods-destroy}%

▸ **destroy**(): `void`

清除任何通过该历史实现附加的事件监听器。

#### 返回值 %{#Methods-destroy-Returns}%

`void`

___

### go %{#Methods-go}%

▸ **go**(`delta`, `triggerListeners?`): `void`

按指定方向访问历史。

**`Example`**

```js
myHistory.go(-1) // equivalent to window.history.back()
myHistory.go(1) // equivalent to window.history.forward()
```

#### 参数 %{#Methods-go-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `delta` | `number` | 访问的距离。如果 delta \< 0 则后退相应数量的记录，如果 \> 0 则前进。 |
| `triggerListeners?` | `boolean` | 是否应该触发连接到该历史的监听器 |

#### 返回值 %{#Methods-go-Returns}%

`void`

___

### listen %{#Methods-listen}%

▸ **listen**(`callback`): () => `void`

给历史实现附加一个监听器，当导航从外部被触发时 (像浏览器的前进后退按钮) 或者向 RouterHistory.back 和 RouterHistory.forward 传递 `true` 时，监听器就会被触发。

#### 参数 %{#Methods-listen-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `callback` | `NavigationCallback` | 附加的监听器 |

#### 返回值 %{#Methods-listen-Returns}%

`fn`

用来移除该监听器的回调函数。

▸ (): `void`

给历史实现附加一个监听器，当导航从外部被触发时 (像浏览器的前进后退按钮) 或者向 RouterHistory.back 和 RouterHistory.forward 传递 `true` 时，监听器就会被触发。

##### 返回值 %{#Methods-listen-Returns-Returns}%

`void`

用来移除该监听器的回调函数。

___

### push %{#Methods-push}%

▸ **push**(`to`, `data?`): `void`

导航到一个地址。在 HTML5 历史实现下，这将调用 `history.pushState` 来有效改变 URL。

#### 参数 %{#Methods-push-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `to` | `string` | location to push |
| `data?` | [`HistoryState`](HistoryState.md) | 可选的 [HistoryState](HistoryState.md) 以关联该导航记录 |

#### 返回值 %{#Methods-push-Returns}%

`void`

___

### replace %{#Methods-replace}%

▸ **replace**(`to`, `data?`): `void`

和 [push](RouterHistory.md#push) 相同，只是执行了 `history.replaceState`
以换掉 `history.pushState`。

#### 参数 %{#Methods-replace-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `to` | `string` | 要设置的地址 |
| `data?` | [`HistoryState`](HistoryState.md) | 可选的 [HistoryState](HistoryState.md) 以关联该导航记录 |

#### 返回值 %{#Methods-replace-Returns}%

`void`
