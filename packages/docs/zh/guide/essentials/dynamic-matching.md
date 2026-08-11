# 带参数的动态路由匹配

<VueSchoolLink
  href="https://vueschool.io/lessons/dynamic-routes"
  title="Learn about dynamic route matching with params"
/>

很多时候，我们需要将给定匹配模式的路由映射到同一个组件。例如，我们可能有一个 `User` 组件，它应该对所有用户进行渲染，但用户 ID 不同。在 Vue Router 中，我们可以在路径中使用一个动态字段来实现，我们称之为_路径参数_：

```js
import User from './User.vue'

// 这些都会传递给 `createRouter`
const routes = [
  // 动态字段以冒号开始
  { path: '/users/:id', component: User },
]
```

现在像 `/users/johnny` 和 `/users/jolyne` 这样的 URL 都会映射到同一个路由。

_路径参数_用冒号 `:` 表示。当一个路由被匹配时，它的 _params_ 的值将在每个组件中以 `route.params` 的形式暴露出来。因此，我们可以通过更新 `User` 的模板来呈现当前的用户 ID：

```vue
<template>
  <div>
    <!-- 当前路由可以通过 $route 在模板中访问 -->
    User {{ $route.params.id }}
  </div>
</template>
```

你可以在同一个路由中设置有多个_路径参数_，它们会映射到 `route.params` 上的相应字段。例如：

| 匹配模式                       | 匹配路径                 | route.params                             |
| ------------------------------ | ------------------------ | ---------------------------------------- |
| /users/:username               | /users/eduardo           | `{ username: 'eduardo' }`                |
| /users/:username/posts/:postId | /users/eduardo/posts/123 | `{ username: 'eduardo', postId: '123' }` |

- [在演练场中查看](https://play.vuejs.org/#eNqdVOtu0zAUfhUrIDWVlrgdF6GQVYNpEkMCpgG/CD+yxm29ObZlO22nqu/O8SWX0W5IVErjnOt3zvmOd1FdUp7e6SiLaC2FMmiH5oqUhnyQEu3RQokajdYNGRW8M1CiMUR12hR7QW9ifVtdKWXq/Qvu7VLZ6FU8wo0mSmNSNaWqBJZCG42no3FqVoTH8RidzdCu4KjHE8MzthKEUnCOfbhWUouGm3j0AhKOQLaHJzqJQnqoLzeklgwizaxDvprObqw/kqUqa51jEDiFdC84aKMEX84uGqUIN75qsDarLMdBh3Y79NIp0kXD2DUo0X7vwmAfJ+flug3YsHCCM6PdGb58JQmj/B4ZcVZEx5tTRLPjijyMwEXok+BBlv/KeDp5KuXp5J85cxwKznHbhNzSrVUH9zUlG4SDYdDneDAs+NTmgRGk50KSCiTpIHNCtuXcJPDQNQmEEUyoDHhDay34e+CCjehigDOQIvDwGO2/kFqoh09UG3idBKEjSk944FPSUb4j/U/o0jX0pmN+K+joT7bOcC44WIUlOnuUInb4Vz67reAAUjw+sSbOW2fol++lc7M/R0/U7lZmX7ysSRhaZl9X1ciFsL+5AOwc2J118INu796/4T8s0rCaw22qaMtyazdYC79ddl0dENgOtKGwJRbJoZnH162QjzogA+Dw3U7qUsL8BAcorvgiKHQRZW07iqiflBUX0coYqTOMGy7vlylUj3uL8zfpJH0LObUZSFOi6+RWiQ0UAAmLKPSniM7BCFdkbYRgOiklfSrFgeH5u3SaTvtMQ91BPpsO2rGH0g0sAF/Q5V+F2yFSRtQ3aShQ61EDSsbE5rOTGdWQDvx8Reb3R+R3euvLuFYEEKzJoGBTqiUxXn35/SvZwrlT1qJqGFg/o7whWrDGYvRmHxteAeyBnUN75eZI+fKHvtwawnVblAXquuHs3XAvnim9h/sqfT3oorsHdDrXdvvhYjpB9tLxfrdCVQSujlO5RQCWVujFZDKBGwSBkVpSntwKY0SdoakitZPLsqoAbCeBLAWHsKhhPiaMGcgL27xgZOtcGAw+cTAyxGH9HscZpvNfXUhGMy5MnLESAohFYh4kGfssAZ6iyxUsc48l2v8BszmoiA==)

除了 `route.params` 之外，`route` 对象还公开了其他有用的信息，如 `route.query` (如果 URL 中存在参数)、`route.hash` 等。你可以在 [API 参考](../../api/interfaces/RouteLocationNormalized.md)中查看完整的细节。

## 响应路由参数的变化

<VueSchoolLink
  href="https://vueschool.io/lessons/reacting-to-param-changes"
  title="Learn how to react to param changes"
/>

使用带有参数的路由时需要注意的是，当用户从 `/users/johnny` 导航到 `/users/jolyne` 时，**相同的组件实例将被重复使用**。因为两个路由都渲染同一个组件，比起销毁再创建，复用则显得更加高效。**不过，这也意味着组件的某些生命周期钩子不会被调用**。

要对同一个组件中参数的变化做出响应的话，你可以简单地 watch `$route` 对象上的任意属性，在这个场景中，就是 `$route.params`：

::: code-group

```vue [Composition API]
<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
  () => route.params.id,
  (newId, oldId) => {
    // 对路由变化做出响应...
  }
)
</script>
```

```vue [Options API]
<script>
export default {
  created() {
    this.$watch(
      () => this.$route.params.id,
      (newId, oldId) => {
        // 对路由变化做出响应...
      }
    )
  },
}
</script>
```

:::

或者，使用 `beforeRouteUpdate` [导航守卫](../advanced/navigation-guards.md)，它还允许你取消导航：

::: code-group

```vue [Composition API]
<script setup>
import { onBeforeRouteUpdate } from 'vue-router'
// ...

onBeforeRouteUpdate(async (to, from) => {
  // 对路由变化做出响应...
  userData.value = await fetchUser(to.params.id)
})
</script>
```

```vue [Options API]
<script>
export default {
  async beforeRouteUpdate(to, from) {
    // 对路由变化做出响应...
    this.userData = await fetchUser(to.params.id)
  },
  // ...
}
</script>
```

:::

## 捕获所有路由或 404 Not found 路由

<VueSchoolLink
  href="https://vueschool.io/lessons/404-not-found-page"
  title="Learn how to make a catch all/404 not found route"
/>

常规参数只匹配 url 片段之间的字符，用 `/` 分隔。如果我们想匹配**任意路径**，我们可以使用自定义的_路径参数_正则表达式，在_路径参数_后面的括号中加入正则表达式：

```js
const routes = [
  // 将匹配所有内容并将其放在 `route.params.pathMatch` 下
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  // 将匹配以 `/user-` 开头的所有内容，并将其放在 `route.params.afterUser` 下
  { path: '/user-:afterUser(.*)', component: UserGeneric },
]
```

在这个特定的场景中，我们在括号之间使用了[自定义正则表达式](./route-matching-syntax.md#在参数中自定义正则)，并将 `pathMatch` 参数标记为[可选且可重复](./route-matching-syntax.md#可选参数)。这样做是为了让我们在需要的时候，可以通过将 `path` 拆分成一个数组，直接导航到路由：

```js
router.push({
  name: 'NotFound',
  // 保留当前路径并删除第一个字符，以避免目标 URL 以 `//` 开头。
  params: { pathMatch: route.path.substring(1).split('/') },
  // 保留现有的查询和 hash 值，如果有的话
  query: route.query,
  hash: route.hash,
})
```

更多内容请参见[重复参数](./route-matching-syntax.md#可重复的参数)部分。

如果你正在使用[历史模式](./history-mode.md)，请务必按照说明正确配置你的服务器。

<RuleKitLink />

## 高级匹配模式

Vue Router 使用自己的路径匹配语法，其灵感来自于 `express`，因此它支持许多高级匹配模式，如可选的参数，零或多个 / 一个或多个，甚至自定义的正则匹配规则。请查看[高级匹配](./route-matching-syntax.md)文档来探索它们。
