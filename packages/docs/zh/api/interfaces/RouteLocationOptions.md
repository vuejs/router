---
editLink: false
---

[API 参考](../index.md) / RouteLocationOptions

# 接口：RouteLocationOptions

对所有导航方法通用的选项。

## 属性 %{#Properties}%

### force %{#Properties-force}%

• `可选` **force**: `boolean`

触发导航，即使该地址与当前地址相同。请注意，这也会新添加一条历史记录，除非传入 `replace: true`。

___

### replace %{#Properties-replace}%

• `可选` **replace**: `boolean`

替换而不是加入一个新的历史记录。

___

### state %{#Properties-state}%

• `可选` **state**: [`HistoryState`](HistoryState.md)

使用 History API 保存的状态。它不能包含任何响应性的值，同时一些诸如 Symbol 的基础类型是被禁用的。更多信息见 https://developer.mozilla.org/en-US/docs/Web/API/History/state
