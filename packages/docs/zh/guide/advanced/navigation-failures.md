# 等待导航结果

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-detecting-navigation-failures"
  title="Learn how to detect navigation failures"
/>

当使用 `router-link` 组件时，Vue Router 会自动调用 `router.push` 来触发一次导航。虽然大多数链接的预期行为是将用户导航到一个新页面，但也有少数情况下用户将留在同一页面上：

- 用户已经位于他们正在尝试导航到的页面
- 一个[导航守卫](./navigation-guards.md)通过调用 `return false` 中断了这次导航
- 当前的导航守卫还没有完成时，一个新的导航守卫会出现了
- 一个[导航守卫](./navigation-guards.md)通过返回一个新的位置，重定向到其他地方 (例如，`return '/login'`)
- 一个[导航守卫](./navigation-guards.md)抛出了一个 `Error`

如果我们想在一个导航完成后做一些事情，我们需要一个在调用 `router.push` 后进行等待的方法。想象一下，我们有一个移动手机菜单，它允许我们进入不同的页面，而我们只想在导航到新页面后隐藏菜单，我们可能想这样做：

```js
router.push('/my-profile')
this.isMenuOpen = false
```

但是这样做会马上关闭菜单，因为 **导航是异步的**，我们需要 `await` `router.push` 返回的 promise ：

```js
await router.push('/my-profile')
this.isMenuOpen = false
```

现在，一旦导航完成，菜单就会关闭，但如果导航被阻止，它也会关闭。我们需要一种方法来检测我们是否真的改变了页面。

## 检测导航故障

如果导航被阻止，导致用户停留在同一个页面上，由 `router.push` 返回的 `Promise` 的解析值将是 _Navigation Failure_。否则，它将是一个 _falsy_ 值(通常是 `undefined`)。这样我们就可以区分我们导航是否离开了当前位置：

```js
const navigationResult = await router.push('/my-profile')

if (navigationResult) {
  // 导航被阻止
} else {
  // 导航成功 (包括重新导航的情况)
  this.isMenuOpen = false
}
```

_Navigation Failure_ 是带有一些额外属性的 `Error` 实例，这些属性为我们提供了足够的信息，让我们知道哪些导航被阻止了以及为什么被阻止了。要检查导航结果的性质，请使用 `isNavigationFailure` 函数：

```js
import { NavigationFailureType, isNavigationFailure } from 'vue-router'

// 试图离开未保存的编辑文本界面
const failure = await router.push('/articles/2')

if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
  // 给用户显示一个小通知
  showToast('You have unsaved changes, discard and leave anyway?')
}
```

::: tip
如果你忽略第二个参数： `isNavigationFailure(failure)`，那么就只会检查这个 `failure` 是不是一个 _Navigation Failure_。
:::

## 鉴别导航故障

正如我们在一开始所说的，有不同的情况会导致导航的中止，所有这些情况都会导致不同的 _Navigation Failure_。它们可以用 `isNavigationFailure` 和 `NavigationFailureType` 来区分。总共有三种不同的类型：

- `aborted`：在导航守卫中返回 `false` 中断了本次导航。
- `cancelled`： 在当前导航还没有完成之前又有了一个新的导航。比如，在等待导航守卫的过程中又调用了 `router.push`。
- `duplicated`：导航被阻止，因为我们已经在目标位置了。

## *导航故障*的属性

所有的导航失败都会暴露 `to` 和 `from` 属性，以反映失败导航的当前位置和目标位置：

```js
// 正在尝试访问 admin 页面
router.push('/admin').then(failure => {
  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    failure.to.path // '/admin'
    failure.from.path // '/'
  }
})
```

在所有情况下，`to` 和 `from` 都是规范化的路由地址。

## 检测重定向

当在导航守卫中返回一个新的位置时，我们会触发一个新的导航，覆盖正在进行的导航。与其他返回值不同的是，重定向不会阻止导航，**而是创建一个新的导航**。因此，通过读取路由地址中的 `redirectedFrom` 属性，对其进行不同的检查：

```js
await router.push('/my-profile')
if (router.currentRoute.value.redirectedFrom) {
  // redirectedFrom 是解析出的路由地址，就像导航守卫中的 to和 from
}
```
