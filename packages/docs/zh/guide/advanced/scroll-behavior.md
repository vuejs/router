# 滚动行为

<VueSchoolLink
  href="https://vueschool.io/lessons/scroll-behavior"
  title="Learn how to customize scroll behavior"
/>

使用客户端路由时，当切换到新路由，我们可能会希望页面滚动到顶部，或者像重新加载页面一样保持原来的滚动位置。Vue Router 不仅支持此功能，还允许你自定义每次路由切换时的滚动行为。

**注意：这个功能只在支持 history.pushState 的浏览器中可用。**

创建 Router 实例时，你可以提供一个 `scrollBehavior` 函数：

```js
const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
  scrollBehavior (to, from, savedPosition) {
    // return 期望滚动到哪个的位置
  }
})
```

`scrollBehavior` 函数接收 `to` 和 `from` 路由对象，就像[导航守卫](./navigation-guards.md)一样。第三个参数 `savedPosition`，只有当这是一个 `popstate` 导航时才可用 (由浏览器的后退/前进按钮触发)。

<RuleKitLink />

该函数可以返回一个 [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions) 位置对象：

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    return { top: 0 }
  },
})
```

你也可以通过 `el` 传递一个 CSS 选择器或一个 DOM 元素。在这种情况下，`top` 和 `left` 将被视为该元素的相对偏移量。

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    // 始终在元素 #main 上方滚动 10px
    return {
      // 也可以这么写
      // el: document.getElementById('main'),
      el: '#main',
      // 在元素上 10 像素
      top: 10,
    }
  },
})
```

如果返回一个 falsy 的值，或者是一个空对象，那么不会发生滚动。

返回 `savedPosition`，在按下后退/前进按钮时，就会像浏览器的原生表现那样：

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})
```

如果你要模拟“滚动到锚点”的行为：

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
      }
    }
  },
})
```

如果你的浏览器支持[滚动行为](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior)，你可以让它变得更流畅：

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
  },
})
```

## 延迟滚动

有时候，我们需要在页面中滚动之前稍作等待。例如，当处理过渡时，我们希望等待过渡结束后再滚动。要做到这一点，你可以返回一个 Promise，它可以返回所需的位置描述符。下面是一个例子，我们在滚动前等待 500ms：

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ left: 0, top: 0 })
      }, 500)
    })
  },
})
```

我们可以将其与页面级过渡组件的事件挂钩，以使滚动行为与你的页面过渡很好地结合起来，但由于使用场景可能存在的差异和复杂性，我们只是提供了这个基础来实现特定的用户场景。

## 高级偏移量

如果你的页面中有固定的导航栏或类似的元素，你可能需要设置偏移量，以确保目标元素不会被其他内容遮挡。
使用静态偏移值并不总是有效。你可以尝试一些基于 CSS 的解决方案，比如使用 `scroll-margin` 或 `scroll-padding` 添加偏移，或者使用 `::before` 和 `::after` 伪元素。然而，这些方法有时会导致意想不到的行为。

在这种情况下，更好的做法是手动计算偏移量。一种简单的方法是结合 CSS 和 JavaScript 的 `getComputedStyle()`。这样每个元素都可以动态定义自己的偏移量。以下是一个示例：

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    const mainElement = document.querySelector('#main')
    if (mainElement) {
      const marginTop = parseFloat(
        getComputedStyle(mainElement).scrollMarginTop
      )
      return {
        el: mainElement,
        top: marginTop,
      }
    } else {
      return { top: 0 }
    }
  },
})
```

## 避免滚动计算

添加 `scrollBehavior` 函数会将 `history.scrollRestoration` 设置为 `manual`，并让路由器计算和存储滚动位置。如果你需要避免计算滚动位置 (这可能会触发布局重新计算)，你可以将 `history.scrollRestoration` 设置为 `auto`，和/或完全不设置 `scrollBehavior`。这样浏览器就会以原生方式处理滚动恢复。
