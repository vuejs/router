# 动态路由

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-dynamic-routing"
  title="Learn how to add routes at runtime"
/>

对路由的添加通常是通过 `routes` 选项来完成的，但是在某些情况下，你可能想在应用程序已经运行的时候添加或删除路由。具有可扩展接口 (如 [Vue CLI UI](https://cli.vuejs.org/dev-guide/ui-api.html)) 这样的应用程序可以使用它来扩展应用程序。

## 添加路由

动态路由主要通过两个函数实现：`router.addRoute()` 用于注册一个新的路由，`router.removeRoute()` 用于删除一个已注册的路由。需要注意的是，新注册的路由如果与当前所处的位置相匹配，则需要你使用 `router.push()` 或 `router.replace()` 来**手动导航**，才能使该新路由生效并显示出来。我们来看一个例子：

想象一下，我们有以下这个只包含一条路由的路由器：

```js
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:articleName', component: Article }],
})
```

进入任何页面，`/about`，`/store`，或者 `/3-tricks-to-improve-your-routing-code` 最终都会呈现 `Article` 组件。如果我们在 `/about` 上添加一个新的路由：

```js
router.addRoute({ path: '/about', component: About })
```

页面仍然会显示 `Article` 组件，我们需要手动调用 `router.replace()` 来改变当前的位置，并覆盖我们原来的位置 (而不是推入一条新的历史记录，导致历史记录中同一个位置出现两次)：

```js
router.addRoute({ path: '/about', component: About })
// 我们也可以使用 this.$route 或 useRoute()
router.replace(router.currentRoute.value.fullPath)
```

记住，如果你需要等待新的路由显示，可以使用 `await router.replace()`。

<RuleKitLink />

## 在导航守卫中添加路由

如果你决定在导航守卫内部添加或删除路由，你不应该调用 `router.replace()`，而是通过返回新的位置来触发重定向：

```js
router.beforeEach(to => {
  if (!hasNecessaryRoute(to)) {
    router.addRoute(generateRoute(to))
    // 触发重定向
    return to.fullPath
  }
})
```

上面的例子有两个假设：第一，新添加的路由记录将与 `to` 位置相匹配，实际上导致与我们试图访问的位置不同。第二，`hasNecessaryRoute()` 在添加新的路由后返回 `true`，以避免无限重定向。

因为我们是在重定向，所以是在替换正在进行的导航，实际行为与前面的例子一样。而在实际场景中，添加路由的行为更有可能发生在导航守卫之外，例如，当一个视图组件挂载时，它会注册新的路由。

## 删除路由

有几个不同的方法来删除现有的路由：

- 通过添加一个名称冲突的路由。如果添加与现有路由名称相同的路由，会先删除路由，再添加路由：

  ```js
  router.addRoute({ path: '/about', name: 'about', component: About })
  // 这将会删除之前已经添加的路由，因为他们具有相同的名字且名字必须是唯一的
  router.addRoute({ path: '/other', name: 'about', component: Other })
  ```

- 通过调用 `router.addRoute()` 返回的回调：

  ```js
  const removeRoute = router.addRoute(routeRecord)
  removeRoute() // 如果路由存在则删除它
  ```

  当路由没有名称时，这很有用。

- 通过使用 `router.removeRoute()` 按名称删除路由：

  ```js
  router.addRoute({ path: '/about', name: 'about', component: About })
  // 删除路由
  router.removeRoute('about')
  ```

  需要注意的是，如果你想使用这个功能，但又想避免名字的冲突，可以在路由中使用 `Symbol` 作为名字。

当路由被删除时，**所有的别名和子路由也会被同时删除**

## 添加嵌套路由

要将嵌套路由添加到现有的路由中，可以将路由的 _name_ 作为第一个参数传递给 `router.addRoute()`，这将有效地添加路由，就像通过 `children` 添加的一样：

```js
router.addRoute({ name: 'admin', path: '/admin', component: Admin })
router.addRoute('admin', { path: 'settings', component: AdminSettings })
```

这等效于：

```js
router.addRoute({
  name: 'admin',
  path: '/admin',
  component: Admin,
  children: [{ path: 'settings', component: AdminSettings }],
})
```

## 查看现有路由

Vue Router 提供了两个函数来查看现有的路由：

- [`router.hasRoute()`](../../api/interfaces/Router.md#Methods-hasRoute)：检查路由是否存在。
- [`router.getRoutes()`](../../api/interfaces/Router.md#Methods-getRoutes)：获取一个包含所有路由记录的数组。
