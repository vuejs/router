---
editLink: false
---

[API 参考](../index.md) / NavigationGuardWithThis

# 接口：NavigationGuardWithThis<T\> %{#interface-navigationguardwiththis-t}%

## 类型参数 %{#Type-parameters}%

| Name |
| :------ |
| `T` |

## 可调用函数 %{#Callable}%

### NavigationGuardWithThis %{#Callable-NavigationGuardWithThis}%

▸ **NavigationGuardWithThis**(`this`, `to`, `from`, `next`): `NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>

导航守卫。详情可查阅[导航守卫](/zh/guide/advanced/navigation-guards.md).

#### 参数 %{#Callable-NavigationGuardWithThis-Parameters}%

| 名称 | 类型 |
| :------ | :------ |
| `this` | `T` |
| `to` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `from` | [`RouteLocationNormalized`](RouteLocationNormalized.md) |
| `next` | [`NavigationGuardNext`](NavigationGuardNext.md) |

#### 返回值 %{#Callable-NavigationGuardWithThis-Returns}%

`NavigationGuardReturn` \| `Promise`<`NavigationGuardReturn`\>
