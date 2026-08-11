# 过渡动效

<VueSchoolLink
  href="https://vueschool.io/lessons/route-transitions"
  title="Learn about route transitions"
/>

想要在你的路由组件上使用转场，并对导航进行动画处理，你需要使用 [`<RouterView>` 插槽](./router-view-slot)：

```html
<router-view v-slot="{ Component }">
  <transition name="fade">
    <component :is="Component" />
  </transition>
</router-view>
```

[Transition 的 API](https://cn.vuejs.org/guide/built-ins/transition.html) 在这里同样适用。

## 单个路由的过渡

上面的用法会对所有的路由使用相同的过渡。如果你想让每个路由的组件有不同的过渡，你可以将[路由元信息](./meta.md)和动态的 `name` 结合在一起，放在`<transition>` 上：

```js
const routes = [
  {
    path: '/custom-transition',
    component: PanelLeft,
    meta: { transition: 'slide-left' },
  },
  {
    path: '/other-transition',
    component: PanelRight,
    meta: { transition: 'slide-right' },
  },
]
```

```html
<router-view v-slot="{ Component, route }">
  <!-- 使用任何自定义过渡，或回退到 `fade` -->
  <transition :name="route.meta.transition || 'fade'">
    <component :is="Component" />
  </transition>
</router-view>
```

<RuleKitLink />

## 基于路由的动态过渡

也可以根据目标路由和当前路由之间的关系，动态地确定使用的过渡。使用和刚才非常相似的片段：

```html
<!-- 使用动态过渡名称 -->
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transition">
    <component :is="Component" />
  </transition>
</router-view>
```

我们可以添加一个[全局后置钩子](./navigation-guards.md#全局后置钩子)，根据路由的深度动态向 `meta` 字段添加信息。

```js
router.afterEach((to, from) => {
  const toDepth = to.path.split('/').length
  const fromDepth = from.path.split('/').length
  to.meta.transition = toDepth < fromDepth ? 'slide-right' : 'slide-left'
})
```

## 强制在复用的视图之间进行过渡

Vue 可能会自动复用看起来相似的组件，从而忽略了任何过渡。幸运的是，可以[添加一个 `key` 属性](https://cn.vuejs.org/api/built-in-special-attributes.html#key)来强制过渡。这也允许你在停留在相同路由上但参数不同时触发过渡：

```vue-html
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

## 初始导航与过渡动效

通常，除非我们添加 `appear` prop，否则 Vue 的 `<Transition>` 会忽略进入动画。但你会注意到，当它与 `<RouterView>` 一起使用时，即使没有设置 `appear` prop，过渡动效也**总是**会被应用。这是因为 Vue Router 中的导航是异步的，这意味着在初始导航完成之前，Vue 应用已经先渲染了一次。有多种方法可以适配这一点。最简单的一种是在挂载应用之前，使用 [`isReady`](../../api/interfaces/Router.md#Methods-isReady) 等待初始导航完成：

```ts
const app = createApp(App)
app.use(router)

// 在初始导航准备好之后再挂载
await router.isReady()
app.mount('#app')
```

<!-- See full example [here](https://github.com/vuejs/vue-router/blob/dev/examples/transitions/app.js). -->
