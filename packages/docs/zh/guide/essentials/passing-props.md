# 将 props 传递给路由组件

<VueSchoolLink
  href="https://vueschool.io/lessons/route-props"
  title="Learn how to pass props to route components"
/>

在你的组件中使用 `$route` 或 `useRoute()` 会与路由紧密耦合，这限制了组件的灵活性，因为它只能用于特定的 URL。虽然这不一定是件坏事，但我们可以通过 `props` 配置来解除这种行为：

回到我们之前的示例：

```vue
<!-- User.vue -->
<template>
  <div>
    User {{ $route.params.id }}
  </div>
</template>
```

和：

```js
import User from './User.vue'

// 传入 `createRouter`
const routes = [
  { path: '/users/:id', component: User },
]
```

我们可以通过声明 prop 来在 `User.vue` 中删除对 `$route` 的直接依赖：

::: code-group

```vue [Composition API]
<!-- User.vue -->
<script setup>
defineProps({
  id: String
})
</script>

<template>
  <div>
    User {{ id }}
  </div>
</template>
```

```vue [Options API]
<!-- User.vue -->
<script>
export default {
  props: {
    id: String
  }
}
</script>

<template>
  <div>
    User {{ id }}
  </div>
</template>
```

:::

然后我们可以通过设置 `props: true` 来配置路由将 `id` 参数作为 prop 传递给组件：

```js
const routes = [
  { path: '/user/:id', component: User, props: true }
]
```

这允许你在任何地方使用该组件，使得该组件更容易重用和测试。

## 布尔模式

当 `props` 设置为 `true` 时，`route.params` 将被设置为组件的 props。

## 命名视图

对于有命名视图的路由，你必须为每个命名视图定义 `props` 配置：

```js
const routes = [
  {
    path: '/user/:id',
    components: { default: User, sidebar: Sidebar },
    props: { default: true, sidebar: false }
  }
]
```

## 对象模式

当 `props` 是一个对象时，它将原样设置为组件 props。当 props 是静态的时候很有用。

```js
const routes = [
  {
    path: '/promotion/from-newsletter',
    component: Promotion,
    props: { newsletterPopup: false }
  }
]
```

## 函数模式

你可以创建一个返回 props 的函数。这允许你将参数转换为其他类型，将静态值与基于路由的值相结合等等。

```js
const routes = [
  {
    path: '/search',
    component: SearchUser,
    props: route => ({ query: route.query.q })
  }
]
```

URL `/search?q=vue` 将传递 `{query: 'vue'}` 作为 props 传给 `SearchUser` 组件。

请尽可能保持 `props` 函数为无状态的，因为它只会在路由发生变化时起作用。如果你需要状态来定义 props，请使用包装组件，这样 vue 才可以对状态变化做出反应。

## 通过 RouterView

你还可以通过 [`<RouterView>` 插槽](../advanced/router-view-slot) 传递任意参数：

```vue-html
<RouterView v-slot="{ Component }">
  <component
    :is="Component"
    view-prop="value"
   />
</RouterView>
```

::: warning
在这种情况下，**所有视图组件**都会接收到 `view-prop`。通常这并不是一个好主意，因为这意味着所有的视图组件都声明了一个 `view-prop` prop，但这未必需要。所以请尽可能使用上述的其他选项。
:::
