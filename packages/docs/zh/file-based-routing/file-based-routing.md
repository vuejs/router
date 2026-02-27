# 文件约定

基于文件的路由尽可能接近 [Nuxt](https://nuxt.com/docs/guide/directory-structure/pages)。

## 路由文件夹结构

默认情况下，此插件会检查 `src/pages` 文件夹中的任何 `.vue` 文件，并根据文件名生成相应的路由结构。这样，在向应用添加路由时，你不再需要维护 `routes` 数组，**只需将新的 `.vue` 组件添加到路由文件夹中，让插件完成其余工作！**

让我们来看一个简单的例子：

```text
src/pages/
├── index.vue
├── about.vue
└── users/
    ├── index.vue
    └── [id].vue
```

这将生成以下路由：

- `/`: -> 渲染 `index.vue` 组件
- `/about`: -> 渲染 `about.vue` 组件
- `/users`: -> 渲染 `users/index.vue` 组件
- `/users/:id`: -> 渲染 `users/[id].vue` 组件。`id` 成为路由参数。

### 索引路由

任何 `index.vue`（**必须全部小写**）文件将生成空路径（类似于 `index.html` 文件）：

- `src/pages/index.vue`: 生成 `/` 路由
- `src/pages/users/index.vue`: 生成 `/users` 路由

### 嵌套路由

嵌套路由是通过在文件夹旁边定义一个 `.vue` 文件**同名的**来自动定义的。如果你创建了 `src/pages/users/index.vue` 和 `src/pages/users.vue` 组件，`src/pages/users/index.vue` 将在 `src/pages/users.vue` 的 `<RouterView>` 中渲染。

换句话说，给定这个文件夹结构：

```text
src/pages/
├── users/
│   └── index.vue
└── users.vue
```

你将得到这个 `routes` 数组：

```js
const routes = [
  {
    path: '/users',
    component: () => import('src/pages/users.vue'),
    children: [
      { path: '', component: () => import('src/pages/users/index.vue') },
    ],
  },
]
```

而省略 `src/pages/users.vue` 组件将生成以下路由：

```js
const routes = [
  {
    path: '/users',
    // 注意这里没有组件
    children: [
      { path: '', component: () => import('src/pages/users/index.vue') },
    ],
  },
]
```

注意文件夹和文件的名称 `users/` 可以是任何有效的命名，如 `my-[id]-param/`。

#### 没有嵌套布局的嵌套路由

有时你可能想要在 URL 中添加 _嵌套_ 形式斜杠，但你不想让它影响你的 UI 层次结构。考虑以下文件夹结构：

```text
src/pages/
├── users/
│   ├── [id].vue
│   └── index.vue
└── users.vue
```

如果你想添加一个新路由 `/users/create`，你可以添加一个新文件 `src/pages/users/create.vue` 但这会将 `create.vue` 组件嵌套在 `users.vue` 组件中。为避免这种情况，你可以创建一个文件 `src/pages/users.create.vue`。`.` 在生成路由时将变成 `/`：

```js
const routes = [
  {
    path: '/users',
    component: () => import('src/pages/users.vue'),
    children: [
      { path: '', component: () => import('src/pages/users/index.vue') },
      { path: ':id', component: () => import('src/pages/users/[id].vue') },
    ],
  },
  {
    path: '/users/create',
    component: () => import('src/pages/users.create.vue'),
  },
]
```

### 命名路由

所有具有 `component` 属性的生成路由都将具有 `name` 属性。这避免了意外地将用户定向到父路由。默认情况下，名称使用文件路径生成，但你可以通过传递自定义 `getRouteName()` 函数来覆盖此行为。你几乎可以在任何地方获得 TypeScript 验证，所以更改应该很容易。

## 路由组

有时，它有助于以不改变路由 URL 的方式组织你的文件结构。路由组让你以逻辑方式组织你的路由，以对你有意义的方式，而不影响实际的 URL。例如，如果你有几个共享相同布局的路由，你可以使用路由组将它们分组在一起。考虑以下文件结构：

```text
src/pages/
├── (admin)/
│   ├── dashboard.vue
│   └── settings.vue
└── (user)/
    ├── profile.vue
    └── order.vue
```

生成的 URL：

```text
- `/dashboard` -> 渲染 `src/pages/(admin)/dashboard.vue`
- `/settings` -> 渲染 `src/pages/(admin)/settings.vue`
- `/profile` -> 渲染 `src/pages/(user)/profile.vue`
- `/order` -> 渲染 `src/pages/(user)/order.vue`
```

这种方法允许你为了更好地可维护性而组织你的文件，而不改变应用路由的结构。

你也可以在页面组件中使用路由组。这等同于将页面组件命名为 `index.vue`：

```text
src/pages/
└─── admin/
    ├── (dashboard).vue // 成为 admin 路由的 index.vue
    └── settings.vue
```

## 命名视图

可以通过在文件名后附加 `@` + 名称来定义 [命名视图](https://router.vuejs.org/guide/essentials/named-views.html#named-views)，例如名为 `src/pages/index@aux.vue` 的文件将生成一个路由：

```js
{
  path: '/',
  component: {
    aux: () => import('src/pages/index@aux.vue')
  }
}
```

请注意，默认情况下非命名路由被命名为 `default`，即使有其他命名视图，你也不需要将文件命名为 `index@default.vue`（例如，拥有 `index@aux.vue` 和 `index.vue` 与拥有 `index@aux.vue` 和 `index@default.vue` 相同）。

## 动态路由

你可以通过用括号包裹 _参数名称_ 来添加 [路由参数](https://router.vuejs.org/guide/essentials/dynamic-matching.html)，例如 `src/pages/users/[id].vue` 将创建一个具有以下路径的路由：`/users/:id`。注意你可以在静态片段之间添加参数：`src/pages/users_[id].vue` -> `/users_:id`。你甚至可以添加多个参数：`src/pages/product_[skuId]_[seoDescription].vue`。

你可以通过用额外的一对括号包裹 _参数名称_ 来创建 [**可选参数**](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#optional-parameters)，例如 `src/pages/users/[[id]].vue` 将创建一个具有以下路径的路由：`/users/:id?`。

你可以通过在右括号后添加加号 (`+`) 来创建 [**可重复参数**](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#repeatable-params)，例如 `src/pages/articles/[slugs]+.vue` 将创建一个具有以下路径的路由：`/articles/:slugs+`。

你可以将两者结合起来创建可选的可重复参数，例如 `src/pages/articles/[[slugs]]+.vue` 将创建一个具有以下路径的路由：`/articles/:slugs*`。

## 通配符 / 404 Not found 路由

要创建通配符路由，请在参数名称前添加 3 个点 (`...`)，例如 `src/pages/[...path].vue` 将创建一个具有以下路径的路由：`/:path(.*)`。这将匹配任何路由。注意这也可以在文件夹内完成，例如 `src/pages/articles/[...path].vue` 将创建一个具有以下路径的路由：`/articles/:path(.*)`。

## 多个路由文件夹

可以通过将数组传递给 `routesFolder` 来提供多个路由文件夹：

```js
VueRouter({
  routesFolder: ['src/pages', 'src/admin/routes'],
})
```

你也可以为每个文件夹提供一个路径前缀，它将 _按原样_ 使用，**不能以 `/` 开头**，但可以包含任何你想要的参数，甚至 **不以 `/` 结尾**：

```ts
import VueRouter from 'vue-router/vite'

VueRouter({
  routesFolder: [
    'src/pages',
    {
      src: 'src/admin/routes',
      // 注意总是有尾随斜杠，并且永远没有前导斜杠
      path: 'admin/',
      // src/admin/routes/dashboard.vue -> /admin/dashboard
    },
    {
      src: 'src/docs',
      // 你可以添加参数
      path: 'docs/:lang/',
      // src/docs/introduction.vue -> /docs/:lang/introduction
    },
    {
      src: 'src/promos',
      // 你可以省略尾随斜杠
      path: 'promos-',
      // src/promos/black-friday.vue -> /promos-black-friday
    },
  ],
})
```

请注意，提供的文件夹必须是分开的，一个 _路由文件夹_ 不能包含另一个指定的 _路由文件夹_。如果你需要进一步的定制，可以尝试 [definePage()](./extending-routes#definepage)。

## 自定义扩展

虽然大多数时候你只会使用 `.vue` 文件，但你也可以指定自定义扩展名作为页面。例如，你可以使用 _markdown_ 文件作为页面：

```ts
import VueRouter from 'vue-router/vite'

VueRouter({
  // 全局设置扩展名
  extensions: ['.vue', '.md'],
  routesFolder: [
    'src/pages',
    {
      src: 'src/docs',
      // 覆盖全局扩展名以 **仅** 接受 markdown 文件
      extensions: ['.md'],
    },
  ],
})
```

在这种情况下，名为 `index.md`（**必须全部小写**）的文件将像 `index.vue` 文件一样生成空路径。
