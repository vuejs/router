# 扩展 RouterLink

<VueSchoolLink
  href="https://vueschool.io/lessons/extending-router-link-for-external-urls"
  title="Learn how to extend router-link"
/>

RouterLink 组件提供了足够的 `props` 来满足大多数基本应用程序的需求，但它并未尝试涵盖所有可能的用例，在某些高级情况下，你可能会发现自己使用了 `v-slot`。在大多数中型到大型应用程序中，值得创建一个（如果不是多个）自定义 RouterLink 组件，以在整个应用程序中重用它们。例如导航菜单中的链接，处理外部链接，添加 `inactive-class` 等。

让我们扩展 RouterLink 来处理外部链接，并在 `AppLink.vue` 文件中添加一个自定义的 `inactive-class`：

```vue
<template>
  <a v-if="isExternalLink" v-bind="$attrs" :href="to" target="_blank">
    <slot />
  </a>
  <router-link
    v-else
    v-bind="$props"
    custom
    v-slot="{ isActive, href, navigate }"
  >
    <a
      v-bind="$attrs"
      :href="href"
      @click="navigate"
      :class="isActive ? activeClass : inactiveClass"
    >
      <slot />
    </a>
  </router-link>
</template>

<script>
import { RouterLink } from 'vue-router'

export default {
  name: 'AppLink',
  inheritAttrs: false,

  props: {
    // 如果使用 TypeScript，请添加 @ts-ignore
    ...RouterLink.props,
    inactiveClass: String,
  },

  computed: {
    isExternalLink() {
      return typeof this.to === 'string' && this.to.startsWith('http')
    },
  },
}
</script>
```

如果你喜欢使用渲染函数或创建 `computed` 属性，你可以使用 [Composition API](./composition-api.md) 中的 `useLink` ：

```js
import { RouterLink, useLink } from 'vue-router'

export default {
  name: 'AppLink',

  props: {
    // 如果使用 TypeScript，请添加 @ts-ignore
    ...RouterLink.props,
    inactiveClass: String,
  },

  setup(props) {
    // `props` 包含 `to` 和任何其他可以传递给 <router-link> 的 prop
    const { navigate, href, route, isActive, isExactActive } = useLink(props)

    // profit!

    return { isExternalLink }
  },
}
```

在实践中，你可能希望将你的 `AppLink` 组件用于应用程序的不同部分。例如，使用 [Tailwind CSS](https://tailwindcss.com)，你可以用所有的类创建一个 `NavLink.vue` 组件：

```vue
<template>
  <AppLink
    v-bind="$attrs"
    class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out"
    active-class="border-indigo-500 text-gray-900 focus:border-indigo-700"
    inactive-class="text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:text-gray-700 focus:border-gray-300"
  >
    <slot />
  </AppLink>
</template>
```
