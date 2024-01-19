# RouterView 插槽

RotuerView 组件暴露了一个插槽，可以用来渲染路由组件：

```vue-html
<router-view v-slot="{ Component }">
  <component :is="Component" />
</router-view>
```

上面的代码等价于不带插槽的 `<router-view />`，但是当我们想要获得其他功能时，插槽提供了额外的扩展性。

## KeepAlive & Transition

当在处理 [KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html) 组件时，我们通常想要保持路由组件活跃，而不是 RouterView 本身。为了实现这个目的，我们可以将 KeepAlive 组件放置在插槽内：

```vue-html
<router-view v-slot="{ Component }">
  <keep-alive>
    <component :is="Component" />
  </keep-alive>
</router-view>
```

类似地，插槽允许我们使用一个 [Transition](https://vuejs.org/guide/built-ins/transition.html) 组件来实现在路由组件之间切换时实现过渡效果：

```vue-html
<router-view v-slot="{ Component }">
  <transition>
    <component :is="Component" />
  </transition>
</router-view>
```

我们也可以在 Transition 组件内使用 KeepAlive 组件：

```vue-html
<router-view v-slot="{ Component }">
  <transition>
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

关于更多 RouterView 组件和 Transition 组件之间的互动，请参考 [Transitions](./transitions) 指南。

## 传递 props 和插槽

我们可以利用其插槽给路由组件传递 props 或插槽：

```vue-html
<router-view v-slot="{ Component }">
  <component :is="Component" some-prop="a value">
    <p>Some slotted content</p>
  </component>
</router-view>
```

实践中通常不会这么做，因为这样会导致所有路由组件**都使用相同的 props 和插槽**。请查阅[传递 props 给路由组件](../essentials/passing-props)获取其他传递 props 的方式。

## 模板引用

使用插槽可以让我们直接将[模板引用](https://vuejs.org/guide/essentials/template-refs.html)放置在路由组件上：

```vue-html
<router-view v-slot="{ Component }">
  <component :is="Component" ref="mainContent" />
</router-view>
```

而如果我们将引用放在 `<router-view>` 上，那引用将会被 RouterView 的实例填充，而不是路由组件本身。
