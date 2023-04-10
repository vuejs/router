---
editLink: false
---

[API 参考](../index.md) / RouteMeta

# 接口：RouteMeta

路由记录中的 `meta` 字段的类型接口。

**`Example`**

```ts
// typings.d.ts 或 router.ts
import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
 }
```

## 继承关系 %{#Hierarchy}%

- `Record`<`string` \| `number` \| `symbol`, `unknown`\>

  ↳ **`RouteMeta`**
