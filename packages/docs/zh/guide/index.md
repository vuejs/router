# 入门

<VueSchoolLink
href="https://vueschool.io/courses/vue-router-4-for-everyone"
title="在 Vue School 上学习如何使用 Vue Router 构建强大的单页应用">观看免费的 Vue Router 视频课程</VueSchoolLink>

Vue Router 是 Vue 官方的客户端路由解决方案。

客户端路由的作用是在单页应用 (SPA) 中将浏览器的 URL 和用户看到的内容绑定起来。当用户在应用中浏览不同页面时，URL 会随之更新，但页面不需要从服务器重新加载。

Vue Router 基于 Vue 的组件系统构建，你可以通过配置**路由**来告诉 Vue Router 为每个 URL 路径显示哪些组件。

::: tip 学习基础
这份指南假设你已经对 Vue 有了一定的了解。你不必是 Vue 的专家，但你也许偶尔需要查看 [Vue 的文档](https://cn.vuejs.org/)来了解某些特性。
:::

## 示例

为了引入一些核心概念，我们将使用如下的示例：

- [Vue 演练场中的示例](https://play.vuejs.org/#eNqFVVtv2zYU/itn6gArmC05btEHTXXTFcWyYZeiLfYy7UGWji02EsmRlOPA8H/fIambnaRD4Fg61++c7yN9DJqc8eirDpKANVIoA0coFOYG30kJJ9gq0cBs3+Is412AEq1B1Xmi2L+ObpvX+3IpI5+b8aFqSJ+rjANErcbQp/v3RrTchLMXlDa7CuZBl07YUoONrCl/bQPT6np9i3UtbLPv0phenVm6L3rQRgm+W79vlULeIQaZmypJ484HxyN87xzRtq3rj+SE08mViX2dlOf7vuAnh/I3xu/AiDdZEGfB+mdBz3ArGkzj0f9sRr4hy5D2zr49ykvjvmdqeTmv9RfDe4i7uM6dxsNiaF9+l0+y+Ts2Qj3cMm3oa94Zfd0py4uBzYFPO6Br3ZPaGzpme9rtQGdxg2WUgOC6Y0PDG/jbjnL0vMAsnhEsQcU4UZaMbU/z8zC3x/PYsbcN/ueilaJW03nDoy1Y+VUkT+0nvHI9PVB6PJE8M44HN2iJ27yt+9q09ek+rFR1oZg0RM5FgmvboKlEqRP/BrATX4SDH171JgBD4CIvThXJVldhP7Y7J9DtxP4nxZKk+470cnFQVuseHh2TlTduWmMEh5uiZsUdSXPAcKlOH/hIZmfEjhODRtPaozNKjyiiGcqn75Ej0Pl3lMyHp2fFeMHnEB/SRia+ict6ep/GXBWV1UGHyGtgh5O1K0KvuC8T/duieoi6tLdvYUYg+rXTmKH3jLmeKoW0owLDI7h8IrnvfAKrIargxfQ/lA0LHjmr8w3W3X3w2dVMIGWchoH9ohEl1pFRrCE2fccsgCY/1Mh3piLjaknc+pujr3TOqedk0eSSrg/BiVU3WtY5dBYMks2CkRtrzoLKGKmTOG65vNtFtON4jLh5Fb2MlnFJJ2tijVA3i40S99rdV1ngNmtr31BQXOLeCFHrRS7Zcy0eBd68jl5H13HNNjFVjxkv8eBq94unMY0mQWzZ7mJIKwtWo/pTGkaCORs2p9+Z+1+dzagWB6BFhcXdE/av+uAhf1RI0+1xMpzJFWnOuz98/gMP9Dw4icW2puhvOD+hFnVrMfqwn1peEuxJnEP7i+OM8d0X/eFgkOt+KAt0FLIj8v03Rh/hvoxeTbaozUONOiq0/aGhX6w5aY1xn7cRqkSVwEoegMCyEl4sl8sf3d1H5RhfbATdKk0C10t5cHaZlyWBHSzUJeNUFtaQww/08Tenz65xSzf+NLJaTTuP5UcARVFMACSwpL9VVyE4/QesCg/V)

让我们首先来看根组件, `App.vue`。

### App.vue

```vue
<template>
  <h1>Hello App!</h1>
  <p>
    <strong>Current route path:</strong> {{ $route.fullPath }}
  </p>
  <nav>
    <RouterLink to="/">Go to Home</RouterLink>
    <RouterLink to="/about">Go to About</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>
```

在这个 `template` 中使用了两个由 Vue Router 提供的组件: `RouterLink` 和 `RouterView`。

不同于常规的 `<a>` 标签，我们使用组件 `RouterLink` 来创建链接。这使得 Vue Router 能够在不重新加载页面的情况下改变 URL，处理 URL 的生成、编码和其他功能。我们将会在之后的部分深入了解 `RouterLink` 组件。

`RouterView` 组件可以使 Vue Router 知道你想要在哪里渲染当前 URL 路径对应的**路由组件**。它不一定要在 `App.vue` 中，你可以把它放在任何地方，但它需要在某处被导入，否则 Vue Router 就不会渲染任何东西。

上述示例还使用了 <code v-pre>{{ $route.fullPath }}</code> 。你可以在组件模板中使用 `$route` 来访问当前的路由对象。

<VueMasteryLogoLink></VueMasteryLogoLink>

### 创建路由器实例

路由器实例是通过调用 `createRouter()` 函数创建的:

```js
import { createMemoryHistory, createRouter } from 'vue-router'

import HomeView from './HomeView.vue'
import AboutView from './AboutView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
```

这里的 `routes` 选项定义了一组路由，把 URL 路径映射到组件。其中，由 `component` 参数指定的组件就是先前在 `App.vue` 中被 `<RouterView>` 渲染的组件。这些路由组件通常被称为*视图*，但本质上它们只是普通的 Vue 组件。

其他可以设置的路由选项我们会在之后介绍，目前我们只需要 `path` 和 `component`。

这里的 `history` 选项控制了路由和 URL 路径是如何双向映射的。在演练场的示例里，我们使用了 `createMemoryHistory()`，它会完全忽略浏览器的 URL 而使用其自己内部的 URL。 这在演练场中可以正常工作，但是未必是你想要在实际应用中使用的。通常，你应该使用 `createWebHistory()` 或 `createWebHashHistory()`。我们将在[不同的历史记录模式](./essentials/history-mode)的部分详细介绍这个主题。

### 注册路由器插件

一旦创建了我们的路由器实例，我们就需要将其注册为插件，这一步骤可以通过调用 `use()` 来完成。

```js
createApp(App)
  .use(router)
  .mount('#app')
```

或等价地：

```js
const app = createApp(App)
app.use(router)
app.mount('#app')
```

和大多数的 Vue 插件一样，`use()` 需要在 `mount()` 之前调用。

如果你好奇这个插件做了什么，它的职责包括：

1. [全局注册](https://cn.vuejs.org/guide/components/registration.html#global-registration) `RouterView` 和 `RouterLink` 组件。
2. 添加全局 `$router` 和 `$route` 属性。
3. 启用 `useRouter()` 和 `useRoute()` 组合式函数。
4. 触发路由器解析初始路由。

### 访问路由器和当前路由

你很可能想要在应用的其他地方访问路由器。

如果你是从 ES 模块导出路由器实例的，你可以将路由器实例直接导入到你需要它的地方。在一些情况下这是最好的方法，但如果我们在组件内部，那么我们还有其他选择。

在组件模板中，路由器实例将被暴露为 `$router`。这与同样被暴露的 `$route` 一样，但注意前者最后有一个额外的 `r`。

如果我们使用选项式 API，我们可以在 JavaScript 中如下访问这两个属性：`this.$router` 和 `this.$route`。在演练场示例中的 `HomeView.vue` 组件中，路由器就是这样获取的。

```js
export default {
  methods: {
    goToAbout() {
      this.$router.push('/about')
    },
  },
}
```

这里调用了 `push()`，这是用于[编程式导航](./essentials/navigation)的方法。我们会在后面详细了解。


对于组合式 API，我们不能通过 `this` 访问组件实例，所以 Vue Router 给我们提供了一些组合式函数。演练场示例中的 `AboutView.vue` 组件使用了这种方法：

```vue
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const search = computed({
  get() {
    return route.query.search ?? ''
  },
  set(search) {
    router.replace({ query: { search } })
  }
})
</script>
```

你现在不一定要完全理解这段代码，关键是要知道可以通过 `useRouter()` 和 `useRoute()` 来访问路由器实例和当前路由。

### 下一步

如果你想要在 Vite 中使用完整的示例，你可以使用 [create-vue](https://github.com/vuejs/create-vue) 工具，它提供了在项目加入 Vue Router 的选项：

::: code-group

```bash [npm]
npm create vue@latest
```

```bash [yarn]
yarn create vue
```

```bash [pnpm]
pnpm create vue
```

:::

上述通过 create-vue 创建的示例项目使用了与我们在这里看到的类似的功能，对于探索后续介绍的其他功能而言，也许你会觉得这是一个不错的起点。

## 本教程的约定

### 单文件组件

Vue Router 经常在配合打包工具 (如 Vite) 和[单文件组件](https://cn.vuejs.org/guide/introduction.html#single-file-components) (即 `.vue` 文件) 的应用中使用。本教程大多数的示例都是如此，但是 Vue Router 本身并不要求你使用构建工具或单文件组件。

例如，若你要使用 [Vue](https://cn.vuejs.org/guide/quick-start.html#using-vue-from-cdn) 和 [Vue Router](../installation#Direct-Download-CDN) 的使用全局构建版本，这些库将被暴露为全局对象，而不是导入：

```js
const { createApp } = Vue
const { createRouter, createWebHistory } = VueRouter
```

### 组件 API 风格

Vue Router 可以使用组合式 API 或选项式 API 。在必要时，示例将会同时使用两种风格，组合式 API 示例通常会使用 `<script setup>`，而不是显式的 `setup` 函数。

如果你对于这两种风格不熟悉，可以参考 [Vue - API 风格](https://cn.vuejs.org/guide/introduction.html#api-styles)。

### `router` 和 `route`

在本教程中，我们常常以 `router` 作为路由器实例提及。即由 `createRouter()` 返回的对象。在应用中，访问该对象的方式取决于上下文。例如，在组合式 API 中，它可以通过调用 `useRouter()` 来访问。在选项式 API 中，它可以通过 `this.$router` 来访问。

类似地，当前路由会以 `route` 被提及。基于不同 API 风格的组件，它可以通过 `useRoute()` 或 `this.$route` 来访问。

### `RouterView` 和 `RouterLink`

组件 `RouterView` 和 `RouterLink` 都是[全局注册](https://cn.vuejs.org/guide/components/registration.html#global-registration)的，因此它们不需要在组件模板中导入。但你也可以通过局部导入它们，例如 `import { RouterLink } from 'vue-router'`。

在模板中，组件的名字可以是 PascalCase 风格或 kebab-case 风格的。Vue 的模板编译器支持两种格式，因此 `<RouterView>` 和 `<router-view>` 通常是等效的。此时应该遵循你自己项目中使用的约定。

如果使用 DOM 内模板，那么需要[注意](https://cn.vuejs.org/guide/essentials/component-basics.html#in-dom-template-parsing-caveats)：组件名字必须使用 kebab-case 风格且不支持自闭合标签。因此你不能直接写 `<RouterView />`，而需要使用 `<router-view></router-view>`。
