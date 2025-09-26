# 类型化路由 <Badge type="tip" text="v4.4.0+" />

<RuleKitLink />

![RouterLink to autocomplete](https://user-images.githubusercontent.com/664177/176442066-c4e7fa31-4f06-4690-a49f-ed0fd880dfca.png)

可以为路由配置一个类型化的映射表。 虽然可以手动实现，但更推荐使用 [unplugin-vue-router](https://github.com/posva/unplugin-vue-router) 插件来自动生成路由及其类型。

## 手动配置

以下是一个手动配置类型化路由的示例：

```ts
// 要为你的路由添加类型，需要从 vue-router 导入 `RouteRecordInfo` 类型
import type { RouteRecordInfo } from 'vue-router'

// 定义一个路由的 interface
export interface RouteNamedMap {
  // 每一个键都是一个名称
  home: RouteRecordInfo<
    // 这里我们的名称是相同的
    'home',
    // 这是路径，它会出现在自动补全中
    '/',
    // 这些是原始参数（可以传递给 router.push() 和 RouterLink 的 "to" 属性）
    // 在这种情况下，不允许有任何参数
    Record<never, never>,
    // 这些是标准化后的参数（即通过 `useRoute()` 获取到的参数）
    Record<never, never>,
    // 这是一个所有子路由名称的联合类型，而在本例中，没有子路由
    never
  >
  // 对每一条路由都要重复这个步骤……
  // 注意，你可以随意为它们命名
  'named-param': RouteRecordInfo<
    'named-param',
    '/:name',
    { name: string | number }, // 允许是字符串或数字
    { name: string }, // 但从 URL 获取时始终为字符串
    'named-param-edit'
  >
  'named-param-edit': RouteRecordInfo<
    'named-param-edit',
    '/:name/edit',
    { name: string | number }, // 我们还需要包含父级路由的参数
    { name: string },
    never
  >
  'article-details': RouteRecordInfo<
    'article-details',
    '/articles/:id+',
    { id: Array<number | string> },
    { id: string[] },
    never
  >
  'not-found': RouteRecordInfo<
    'not-found',
    '/:path(.*)',
    { path: string },
    { path: string },
    never
  >
}

// 最后，你需要把这份路由映射表扩展到 Vue Router 的类型定义中
declare module 'vue-router' {
  interface TypesConfig {
    RouteNamedMap: RouteNamedMap
  }
}
```

::: tip

这种方式确实繁琐且容易出错。正因如此，强烈推荐使用 [unplugin-vue-router](https://github.com/posva/unplugin-vue-router) 来自动生成路由和类型。

:::
