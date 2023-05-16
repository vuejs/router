---
editLink: false
---

[API 参考](../index.md) / NavigationGuard

# 接口：NavigationGuard %{#interface-navigationguard}%

## 可调用函数 %{#Callable}%

### NavigationGuard %{#Callable-NavigationGuard}%

▸ **NavigationGuard**(`to`, `from`, `next`): `NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>

导航守卫。详情可查阅[导航守卫](/zh/guide/advanced/navigation-guards.md).

#### 参数 %{#Callable-NavigationGuard-Parameters}%

| 名称 | 类型 |
| :------ | :------ |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `from` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `next` | [`NavigationGuardNext`](NavigationGuardNext.md) |

#### 返回值 %{#Callable-NavigationGuard-Returns}%

`NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>
