# 匹配当前路由的链接

应用程序通常都会有一个渲染 RouterLink 列表的导航组件。我们也许想对这个列表中匹配当前路由的链接进行视觉区分。

RouterLink 组件会为匹配当前路由的链接添加两个 CSS 类，`router-link-active` 和 `router-link-exact-active`。要理解它们之间的区别，我们首先需要了解 Vue Router 如何判断一个链接是**匹配当前路由的**。

## 链接在什么时候匹配当前路由

当满足以下条件时，RouterLink 被认为是**匹配当前路由的**：

1. 它与当前路径匹配相同的路由记录（即配置的路由）。
2. 它的 `params` 与当前路径的 `params` 相同。

如果你使用了[嵌套路由](./nested-routes)，任何指向祖先路由的链接也会被认为是匹配当前路由的，只要相关的 `params` 匹配。

其他路由属性，例如 [`query`](../../api/interfaces/RouteLocationNormalized#query)，不会被考虑在内。

路径不一定需要完全匹配。例如，使用 [`alias`](./redirect-and-alias#Alias) 仍然会被认为是匹配的，只要它解析到相同的路由记录和 `params`。

如果一个路由有 [`redirect`](./redirect-and-alias#Redirect)，在检查链接是否匹配当前路由时不会跟随重定向。

## 精确匹配当前路由的链接

**精确**匹配不包括祖先路由。

假设我们有以下路由：

```js
const routes = [
  {
    path: '/user/:username',
    component: User,
    children: [
      {
        path: 'role/:roleId',
        component: Role,
      },
    ],
  },
]
```

然后考虑这两个链接：

```vue-html
<RouterLink to="/user/erina">
  User
</RouterLink>
<RouterLink to="/user/erina/role/admin">
  Role
</RouterLink>
```

如果当前路径是 `/user/erina/role/admin`，那么这两个链接都会被认为是**匹配当前路由的**，因此 `router-link-active` 类会应用于这两个链接。但只有第二个链接会被认为是**精确的**，因此只有第二个链接会有 `router-link-exact-active` 类。

<RuleKitLink />

## 配置类名

RouterLink 组件有两个属性，`activeClass` 和 `exactActiveClass`，可以用来更改应用的类名：

```vue-html
<RouterLink
  activeClass="border-indigo-500"
  exactActiveClass="border-indigo-700"
  ...
>
```

默认的类名也可以通过传递 `linkActiveClass` 和 `linkExactActiveClass` 选项给 `createRouter()` 来全局更改：

```js
const router = createRouter({
  linkActiveClass: 'border-indigo-500',
  linkExactActiveClass: 'border-indigo-700',
  // ...
})
```

参见[扩展 RouterLink](../advanced/extending-router-link) 以获取使用 `v-slot` API 进行更高级自定义的技术。
