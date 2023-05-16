---
editLink: false
---

[API 参考](../index.md) / RouterScrollBehavior

# 接口：RouterScrollBehavior

## 可调用函数 %{#Callable}%

### RouterScrollBehavior %{#Callable-RouterScrollBehavior}%

▸ **RouterScrollBehavior**(`to`, `from`, `savedPosition`): `Awaitable`<``false`` \| `void` \| `ScrollPosition`\>

#### 参数 %{#Callable-RouterScrollBehavior-Parameters}%

| 名称 | 类型 | 描述 |
| :------ | :------ | :------ |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) | 我们要导航到的路由地址 |
| `from` | [`RouteLocationNormalizedLoaded`](RouteLocationNormalizedLoaded.md) | 我们要离开的路由地址 |
| `savedPosition` | ``null`` \| `_ScrollPositionNormalized` | 要保存的页面位置，如果不存在则是 `null` |

#### 返回值 %{#Callable-RouterScrollBehavior-Returns}%

`Awaitable`<``false`` \| `void` \| `ScrollPosition`\>
