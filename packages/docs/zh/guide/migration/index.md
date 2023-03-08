# 从 Vue2 迁移

在 Vue Router API 从 v3（Vue2）到 v4（Vue3）的重写过程中，大部分的 Vue Router API 都没有变化，但是在迁移你的程序时，你可能会遇到一些破坏性的变化。本指南将帮助你了解为什么会发生这些变化，以及如何调整你的程序，使其与 Vue Router4 兼容。

## 破坏性变化

变化的顺序是按其用途排列的。因此，建议按照这个清单的顺序进行。

### new Router 变成 createRouter

Vue Router 不再是一个类，而是一组函数。现在你不用再写 `new Router()`，而是要调用 `createRouter`:

```js
// 以前是
// import Router from 'vue-router'
import { createRouter } from 'vue-router'

const router = createRouter({
  // ...
})
```

### 新的 `history` 配置取代 `mode`

`mode: 'history'` 配置已经被一个更灵活的 `history` 配置所取代。根据你使用的模式，你必须用适当的函数替换它：

- `"history"`: `createWebHistory()`
- `"hash"`: `createWebHashHistory()`
- `"abstract"`: `createMemoryHistory()`

下面是一个完整的代码段：

```js
import { createRouter, createWebHistory } from 'vue-router'
// 还有 createWebHashHistory 和 createMemoryHistory

createRouter({
  history: createWebHistory(),
  routes: [],
})
```

在 SSR 上使用时，你需要手动传递相应的 history：

```js
// router.js
let history = isServer ? createMemoryHistory() : createWebHistory()
let router = createRouter({ routes, history })
// 在你的 server-entry.js 中的某个地方
router.push(req.url) // 请求 url
router.isReady().then(() => {
  // 处理请求
})
```

**原因**：为未使用的 history 启用摇树，以及为高级用例（如原生解决方案）实现自定义 history。

### 移动了 `base` 配置

现在，`base` 配置被作为 `createWebHistory` (其他 history 也一样)的第一个参数传递：

```js
import { createRouter, createWebHistory } from 'vue-router'
createRouter({
  history: createWebHistory('/base-directory/'),
  routes: [],
})
```

### 删除了 `fallback` 属性

创建路由时不再支持 `fallback` 属性：

```diff
-new VueRouter({
+createRouter({
-  fallback: false,
// other options...
})
```

**原因**: Vue支持的所有浏览器都支持 [HTML5 History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)，因此我们不再需要使用 `location.hash`，而可以直接使用 `history.pushState()`。

### 删除了 `*`（星标或通配符）路由

现在必须使用自定义的 regex 参数来定义所有路由(`*`、`/*`)：

```js
const routes = [
  // pathMatch 是参数的名称，例如，跳转到 /not/found 会得到
  // { params: { pathMatch: ['not', 'found'] } }
  // 这要归功于最后一个 *，意思是重复的参数，如果你
  // 打算直接使用未匹配的路径名称导航到该路径，这是必要的
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  // 如果你省略了最后的 `*`，在解析或跳转时，参数中的 `/` 字符将被编码
  { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound },
]
// 如果使用命名路由，不好的例子：
router.resolve({
  name: 'bad-not-found',
  params: { pathMatch: 'not/found' },
}).href // '/not%2Ffound'
// 好的例子:
router.resolve({
  name: 'not-found',
  params: { pathMatch: ['not', 'found'] },
}).href // '/not/found'
```

:::tip
如果你不打算使用其名称直接跳转到未找到的路由，则无需为重复的参数添加 `*`。如果你调用 `router.push('/not/found/url')`，它将提供正确的 `pathMatch` 参数。
:::

**原因**：Vue Router 不再使用 `path-to-regexp`，而是实现了自己的解析系统，允许路由排序并实现动态路由。由于我们通常在每个项目中只添加一个通配符路由，所以支持 `*` 的特殊语法并没有太大的好处。参数的编码是跨路由的，无一例外，让事情更容易预测。

### 将 `onReady` 改为 `isReady`

现有的 `router.onReady()` 函数已被 `router.isReady()` 取代，该函数不接受任何参数并返回一个 Promise：

```js
// 将
router.onReady(onSuccess, onError)
// 替换成
router.isReady().then(onSuccess).catch(onError)
// 或者使用 await:
try {
  await router.isReady()
  // 成功
} catch (err) {
  // 报错
}
```

### `scrollBehavior` 的变化

`scrollBehavior` 中返回的对象与 [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions) 类似：`x` 改名为 `left`，`y` 改名为 `top`。详见 [RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0035-router-scroll-position.md)。

**原因**：使该对象类似于 `ScrollToOptions`，以使其感觉更像原生 JS API，并有可能启用将来的新配置。

### `<router-view>`、`<keep-alive>` 和 `<transition>`

`transition` 和 `keep-alive` 现在必须通过 `v-slot` API 在 `RouterView` **内部**使用：

```vue
<router-view v-slot="{ Component }">
  <transition>
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

**原因**: 这是一个必要的变化。详见 [related RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0034-router-view-keep-alive-transitions.md).

### 删除 `<router-link>` 中的 `append` 属性

`<router-link>` 中的 `append` 属性已被删除。你可以手动将值设置到现有的 `path` 中：

```html
将
<router-link to="child-route" append>to relative child</router-link>
替换成
<router-link :to="append($route.path, 'child-route')">
  to relative child
</router-link>
```

你必须在 _App_ 实例上定义一个全局的 `append` 函数：

```js
app.config.globalProperties.append = (path, pathToAppend) =>
  path + (path.endsWith('/') ? '' : '/') + pathToAppend
```

**原因**：`append` 使用频率不高，用户可以很容易地实现。

### 删除 `<router-link>` 中的 `event` 和 `tag` 属性

`<router-link>` 中的 `event` 和 `tag` 属性都已被删除。你可以使用 [`v-slot` API](/zh/guide/advanced/composition-api#uselink) 来完全定制 `<router-link>`：

```html
将
<router-link to="/about" tag="span" event="dblclick">About Us</router-link>
替换成
<router-link to="/about" custom v-slot="{ navigate }">
  <span @click="navigate" @keypress.enter="navigate" role="link">About Us</span>
</router-link>
```

**原因**：这些属性经常一起使用，以使用与 `<a>` 标签不同的东西，但这些属性是在 `v-slot` API 之前引入的，并且没有足够的使用，因此没有足够的理由为每个人增加 bundle 包的大小。

### 删除 `<router-link>` 中的 `exact` 属性

`exact` 属性已被删除，因为不再存在要修复的警告，所以你应该能够安全地删除它。但，有两件事你应该注意：

- 路由现在是基于它们所代表的路由记录来激活的，而不是路由地址对象及其 `path`、`query` 和 `hash` 属性来激活的
- 只匹配 `path` 部分，`query` 和 `hash` 不再考虑

如果你想自定义这种行为，例如考虑到 `hash` 部分，你应该使用 [`v-slot` API](/zh/guide/advanced/composition-api#uselink) 来扩展`<router-link>`。

**原因**: 详见 [RFC about active matching](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0028-router-active-link.md#summary)。

### 忽略 mixins 中的导航守卫

目前不支持 mixins 中的导航守卫，你可以在 [vue-router#454](https://github.com/vuejs/router/issues/454) 追踪它的支持情况。

### 删除 `router.match` 改为 `router.resolve`

`router.match` 和 `router.resolve` 已合并到 `router.resolve` 中，签名略有不同。[详见 API](/zh/api/interfaces/Router#Methods-resolve)。

**原因**：将用于同一目的的多种方法统一起来。

### 删除 `router.getMatchedComponents()`

`router.getMatchedComponents` 方法现在被删除，因为匹配的组件可以从 `router.currentRoute.value.matched` 中获取：

```js
router.currentRoute.value.matched.flatMap(record =>
  Object.values(record.components)
)
```

**原因**：这个方法只在 SSR 中使用，并且是用户一行就能完成的操作。

### **所有**的导航现在都是异步的

所有的导航，包括第一个导航，现在都是异步的，这意味着，如果你使用一个 `transition`，你可能需要等待路由 _ready_ 好后再挂载程序：

```js
app.use(router)
// 注意：在服务器端，你需要手动跳转到初始地址。
router.isReady().then(() => app.mount('#app'))
```

否则会有一个初始过渡，就像你提供了 `appear` 属性到 `transition` 一样，因为路由会显示它的初始地址（什么都没有），然后显示第一个地址。

请注意，**如果在初始导航时有导航守卫**，你可能不想阻止程序渲染，直到它们被解析，除非你正在进行服务器端渲染。否则，在这种情况下，不等待路由准备好挂载应用会产生与 Vue2 中相同的结果。

### 删除 `router.app`

`router.app` 用于表示注入路由的最后一个根组件（Vue 实例）。Vue Router 现在可以被多个 Vue 程序同时安全使用。你仍然可以在使用路由时添加它：

```js
app.use(router)
router.app = app
```

你也可以扩展 `Router` 接口的 TypeScript 定义来添加 `app` 属性。

**原因**：Vue3 写的程序不能在 Vue2 中使用，现在我们使用同一个 Router 实例来支持多个程序，因此拥有 `app` 属性可能会产生误导，因为它是程序而不是根实例。

### 将内容传递给路由组件的 `<slot>`

之前你可以直接传递一个模板，通过嵌套在 `<router-view>` 组件下，由路由组件的 `<slot>` 来渲染：

```html
<router-view>
  <p>In Vue Router 3, I render inside the route component</p>
</router-view>
```

由于 `<router-view>` 引入了 `v-slot` API，你必须使用 `v-slot` API 将其传递给 `<component>`：

```html
<router-view v-slot="{ Component }">
  <component :is="Component">
    <p>In Vue Router 3, I render inside the route component</p>
  </component>
</router-view>
```

### 将 `parent` 从路由地址中删除

`parent` 属性已从标准化路由地址（`this.$route` 和 `router.resolve` 返回的对象）中删除。你仍然可以通过 `matched` 数组访问它：

```js
const parent = this.$route.matched[this.$route.matched.length - 2]
```

**原因**：同时存在 `parent` 和 `children` 会造成不必要的循环引用，而属性可以通过 `matched` 来检索。

### 删除 `pathToRegexpOptions`

路由的 `pathToRegexpOptions` 和 `caseSensitive` 属性已被 `createRouter()` 的 `sensitive` 和 `strict` 配置取代。现在，当使用 `createRouter()` 创建路由时，它们也可以直接传递。`path-to-regexp` 的任何其他特定配置已被删除，因为 `path-to-regexp` 已不再用于解析路径。

### 删除未命名的参数

由于取消了 `path-to-regexp`，所以不再支持未命名的参数：

- `/foo(/foo)?/suffix` 变成 `/foo/:_(foo)?/suffix`
- `/foo(foo)?` 变成 `/foo:_(foo)?`
- `/foo/(.*)` 变成 `/foo/:_(.*)`

:::tip
请注意，你可以使用任何名称代替 `_` 作为参数。重点是要提供一个名字。
:::

### `history.state` 的用法

Vue Router 将信息保存在 `history.state` 上。如果你有任何手动调用 `history.pushState()` 的代码，你应该避免它，或者用的 `router.push()` 和 `history.replaceState()` 进行重构：

```js
// 将
history.pushState(myState, '', url)
// 替换成
await router.push(url)
history.replaceState({ ...history.state, ...myState }, '')
```

同样，如果你在调用 `history.replaceState()` 时没有保留当前状态，你需要传递当前 `history.state`：

```js
// 将
history.replaceState({}, '', url)
// 替换成
history.replaceState(history.state, '', url)
```

**原因**：我们使用历史状态来保存导航信息，如滚动位置，以前的地址等。

### `options` 中需要配置 `routes`

`options` 中的 `routes` 属性现在是必需的。

```js
createRouter({ routes: [] })
```

**原因**：路由的设计是为了创建路由，尽管你可以在以后添加它们。在大多数情况下，你至少需要一条路由，一般每个应用都会编写一次。

### 不存在的命名路由

跳转或解析不存在的命名路由会产生错误：

```js
// 哎呀，我们的名字打错了
router.push({ name: 'homee' }) // 报错
router.resolve({ name: 'homee' }) // 报错
```

**原因**：以前，路由会导航到 `/`，但不显示任何内容（而不是主页）。抛出一个错误更有意义，因为我们不能生成一个有效的 URL 进行导航

### 命名路由缺少必要的 `params`

在没有传递所需参数的情况下跳转或解析命名路由，会产生错误：

```js
// 给与以下路由:
const routes = [{ path: '/users/:id', name: 'user', component: UserDetails }]

// 缺少 `id` 参数会失败
router.push({ name: 'user' })
router.resolve({ name: 'user' })
```

**原因**：同上。

### 带有空 `path` 的命名子路由不再添加斜线

给予任何空 `path` 的嵌套命名路由：

```js
const routes = [
  {
    path: '/dashboard',
    name: 'dashboard-parent',
    component: DashboardParent,
    children: [
      { path: '', name: 'dashboard', component: DashboardDefault },
      {
        path: 'settings',
        name: 'dashboard-settings',
        component: DashboardSettings,
      },
    ],
  },
]
```

现在，导航或解析到命名的路由 `dashboard` 时，会产生一个**不带斜线的** URL：

```js
router.resolve({ name: 'dashboard' }).href // '/dashboard'
```

这对子级 `redirect` 有重要的副作用，如下所示：

```js
const routes = [
  {
    path: '/parent',
    component: Parent,
    children: [
      // 现在将重定向到 `/home` 而不是 `/parent/home`
      { path: '', redirect: 'home' },
      { path: 'home', component: Home },
    ],
  },
]
```

请注意，如果 `path` 是 `/parent/`，这也可以，因为 `home` 到 `/parent/` 的相对地址确实是 `/parent/home`，但 `home` 到 `/parent` 的相对地址是 `/home`。

<!-- Learn more about relative links [in the cookbook](/cookbook/relative-links.md). -->

**原因**：这是为了使尾部的斜线行为保持一致：默认情况下，所有路由都允许使用尾部的斜线。可以通过使用 `strict` 配置和手动添加(或不添加)斜线来禁用它。

<!-- TODO: maybe a cookbook entry -->

### `$route` 属性编码

无论在哪里启动导航，`params`、`query`和 `hash` 中的解码值现在都是一致的（旧的浏览器仍然会产生未编码的 `path` 和 `fullPath`）。初始导航应产生与应用内部导航相同的结果。

<!-- TODO: translate chinese API entries -->

给定任何[规范化的路由地址](/zh/api/interfaces/RouteLocationNormalized.md):

- `path`, `fullPath`中的值不再被解码了。例如，直接在地址栏上写 "<https://example.com/hello> world"，将得到编码后的版本："https://example.com/hello%20world"，而 "path "和 "fullPath "都是"/hello%20world"。
- `hash` 现在被解码了，这样就可以复制过来。`router.push({ hash: $route.hash })` 可以直接用于 [scrollBehavior](/zh/api/interfaces/RouterOptions.md#Properties-scrollBehavior) 的 `el` 配置中。
- 当使用 `push`、`resolve` 和 `replace` 并在对象中提供 `string` 地址或 `path` 属性时，**必须进行编码**(像以前的版本一样)。另一方面，`params`、`query` 和 `hash` 必须以未编码的版本提供。
- 斜线字符(`/`)现在已在 `params` 内正确解码，同时仍在 URL 上产生一个编码版本：`%2F`。

**原因**：这样，在调用 `router.push()` 和 `router.resolve()` 时，可以很容易地复制一个地址的现有属性，并使产生的路由地址在各浏览器之间保持一致。`router.push()` 现在是幂等的，这意味着调用 `router.push(route.fullPath)`、`router.push({ hash: route.hash })`、`router.push({ query: route.query })` 和`router.push({ params: route.params })` 不会产生额外的编码。

### TypeScript 变化

为了使类型更一致，更有表现力，有些类型被重新命名：

| `vue-router@3` | `vue-router@4`          |
| -------------- | ----------------------- |
| RouteConfig    | RouteRecordRaw          |
| Location       | RouteLocation           |
| Route          | RouteLocationNormalized |

## 新功能

Vue Router4 中需要关注的一些新功能包括：

- [动态路由](../advanced/dynamic-routing.md)
- [组合式 API](../advanced/composition-api.md)
<!-- - Custom History implementation -->
