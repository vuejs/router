---
sidebar: auto
---

# API 参考

## `<router-link>` Props

### to

- **类型**：[`RouteLocationRaw`](#routelocationraw)
- **详细内容**：

  表示目标路由的链接。当被点击后，内部会立刻把 `to` 的值传到 `router.push()`，所以这个值可以是一个 `string` 或者是[描述目标位置的对象](#routelocationraw)。

```html
<!-- 字符串 -->
<router-link to="/home">Home</router-link>
<!-- 渲染结果 -->
<a href="/home">Home</a>

<!-- 使用 v-bind 的 JS 表达式 -->
<router-link :to="'/home'">Home</router-link>

<!-- 同上 -->
<router-link :to="{ path: '/home' }">Home</router-link>

<!-- 命名的路由 -->
<router-link :to="{ name: 'user', params: { userId: '123' }}">User</router-link>

<!-- 带查询参数，下面的结果为 `/register?plan=private` -->
<router-link :to="{ path: '/register', query: { plan: 'private' }}">
  Register
</router-link>
```

### replace

- **类型**：`boolean`
- **默认值**：`false`
- **详细内容**：

  设置 `replace` 属性的话，当点击时，会调用 `router.replace()`，而不是 `router.push()`，所以导航后不会留下历史记录。

```html
<router-link to="/abc" replace></router-link>
```

### active-class

- **类型**：`string`
- **默认值**：`"router-link-active"` (或者全局 [`linkActiveClass`](#linkactiveclass))
- **详细内容**：

  链接激活时，应用于渲染的 `<a>` 的 class。

### aria-current-value

- **类型**：`'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'` (`string`)
- **默认值**：`"page"`
- **详细内容**：

  当链接激活时，传递给属性 `aria-current` 的值。

### custom

- **类型**：`boolean`
- **默认值**：`false`
- **详细内容**：

  `<router-link>` 是否应该将其内容包裹在 `<a>` 元素中。在使用 [`v-slot`](#router-link-s-v-slot) 创建自定义 RouterLink 时很有用。默认情况下，`<router-link>` 会将其内容包裹在 `<a>` 元素中，即使使用 `v-slot` 也是如此。传递`自定义的` prop，可以去除这种行为。

- **例如**：

  ```html
  <router-link to="/home" custom v-slot="{ navigate, href, route }">
    <a :href="href" @click="navigate">{{ route.fullPath }}</a>
  </router-link>
  ```

  渲染成 `<a href="/home">/home</a>`。

  ```html
  <router-link to="/home" v-slot="{ route }">
    <span>{{ route.fullPath }}</span>
  </router-link>
  ```

  渲染成 `<a href="/home"><span>/home</span></a>`。

### exact-active-class

- **类型**：`string`
- **默认值**：`"router-link-exact-active"` (或者全局 [`linkExactActiveClass`](#linkexactactiveclass))
- **详细内容**：

  链接精准激活时，应用于渲染的 `<a>` 的 class。

## `<router-link>` 的 `v-slot`

`<router-link>` 通过一个[作用域插槽](https://v3.vuejs.org/guide/component-slots.html#scoped-slots)暴露底层的定制能力。这是一个更高阶的 API，主要面向库作者，但也可以为开发者提供便利，大多数情况下用在一个类似 _NavLink_ 这样的组件里。

:::tip 注意
记得把 `custom` 配置传递给 `<router-link>`，以防止它将内容包裹在 `<a>` 元素内。
:::

```html
<router-link
  to="/about"
  custom
  v-slot="{ href, route, navigate, isActive, isExactActive }"
>
  <NavLink :active="isActive" :href="href" @click="navigate">
    {{ route.fullPath }}
  </NavLink>
</router-link>
```

- `href`：解析后的 URL。将会作为一个 `<a>` 元素的 `href` 属性。如果什么都没提供，则它会包含 `base`。
- `route`：解析后的规范化的地址。
- `navigate`：触发导航的函数。 **会在必要时自动阻止事件**，和 `router-link` 一样。例如：`ctrl` 或者 `cmd` + 点击仍然会被 `navigate` 忽略。
- `isActive`：如果需要应用 [active class](#active-class)，则为 `true`。允许应用一个任意的 class。
- `isExactActive`：如果需要应用 [exact active class](#exact-active-class)，则为 `true`。允许应用一个任意的 class。

### 示例：将激活的 class 应用在外层元素

有时我们可能想把激活的 class 应用到一个外部元素而不是 `<a>` 标签本身，这时你可以在一个 `router-link` 中包裹该元素并使用 `v-slot` 属性来创建链接：

```html
<router-link
  to="/foo"
  custom
  v-slot="{ href, route, navigate, isActive, isExactActive }"
>
  <li
    :class="[isActive && 'router-link-active', isExactActive && 'router-link-exact-active']"
  >
    <a :href="href" @click="navigate">{{ route.fullPath }}</a>
  </li>
</router-link>
```

:::tip 提示
如果你在 `a` 元素上添加一个 `target="_blank"`，你必须省略 `@click="navigate"` 的处理。
:::

## `<router-view>` Props

### name

- **类型**：`string`
- **默认值**：`"default"`
- **详细内容**：

  如果 `<router-view>` 设置了 `name`，则会渲染对应的路由配置中 `components` 下的相应组件。

- **更多的内容请看**：[命名视图](../guide/essentials/named-views.md)

### route

- **类型**：[`RouteLocationNormalized`](#routelocationnormalized)
- **详细内容**：

  一个路由地址的所有组件都已被解析（如果所有组件都被懒加载），因此可以显示。

## `<router-view>` 的 `v-slot`

`<router-view>` 暴露了一个 `v-slot` API，主要使用 `<transition>` 和 `<keep-alive>` 组件来包裹你的路由组件。

```html
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transition || 'fade'" mode="out-in">
    <keep-alive>
      <suspense>
        <template #default>
          <component
            :is="Component"
            :key="route.meta.usePathKey ? route.path : undefined"
          />
        </template>
        <template #fallback> Loading... </template>
      </suspense>
    </keep-alive>
  </transition>
</router-view>
```

- `Component`: VNodes, 传递给 `<component>`的`is` prop。
- `route`: 解析出的标准化[路由地址](#routelocationnormalized)。

## createRouter

创建一个可以被 Vue 应用程序使用的路由实例。查看 [`RouterOptions`](#routeroptions) 中的所有可以传递的属性列表。

**函数签名：**

```typescript
export declare function createRouter(options: RouterOptions): Router
```

### 参数

| 参数    | 类型                            | 描述                      |
| ------- | ------------------------------- | ------------------------- |
| options | [RouterOptions](#routeroptions) | Options 用来初始化 router |

## createWebHistory

创建一个 HTML5 历史，即单页面应用程序中最常见的历史记录。应用程序必须通过 http 协议被提供服务。

**函数签名：**

```typescript
export declare function createWebHistory(base?: string): RouterHistory
```

### 参数

| 参数 | 类型     | 描述                                                                                             |
| ---- | -------- | ------------------------------------------------------------------------------------------------ |
| base | `string` | 提供的可选 base。当应用程序被托管在诸如 `https://example.com/folder/` 之类的文件夹中时非常有用。 |

### 示例

```js
createWebHistory() // 没有 base，应用托管在域名 `https://example.com` 的根目录下。
createWebHistory('/folder/') // 给出的网址为 `https://example.com/folder/`
```

## createWebHashHistory

创建一个 hash 历史记录。对于没有主机的 web 应用程序 (例如 `file://`)，或当配置服务器不能处理任意 URL 时这非常有用。**注意：如果 SEO 对你很重要，你应该使用 [`createWebHistory`](#createwebhistory)**。

**函数签名：**

```typescript
export declare function createWebHashHistory(base?: string): RouterHistory
```

### 参数

| 参数 | 类型     | 描述                                                                                                                                                                                                                                                                                        |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| base | `string` | 提供可选的 base。默认是 `location.pathname + location.search`。如果 `head` 中有一个 `<base>`，它的值将被忽略，而采用这个参数。**但请注意它会影响所有的 history.pushState() 调用**，这意味着如果你使用一个 `<base>` 标签，它的 `href` 值**必须与这个参数相匹配** (请忽略 `#` 后面的所有内容) |

### 示例

```js
// at https://example.com/folder
createWebHashHistory() // 给出的网址为 `https://example.com/folder#`
createWebHashHistory('/folder/') // 给出的网址为 `https://example.com/folder/#`
// 如果在 base 中提供了 `#`，则它不会被 `createWebHashHistory` 添加
createWebHashHistory('/folder/#/app/') // 给出的网址为 `https://example.com/folder/#/app/`
// 你应该避免这样做，因为它会更改原始 url 并打断正在复制的 url
createWebHashHistory('/other-folder/') // 给出的网址为 `https://example.com/other-folder/#`

// at file:///usr/etc/folder/index.html
// 对于没有 `host` 的位置，base被忽略
createWebHashHistory('/iAmIgnored') // 给出的网址为 `file:///usr/etc/folder/index.html#`
```

## createMemoryHistory

创建一个基于内存的历史记录。这个历史记录的主要目的是处理 SSR。它在一个特殊的位置开始，这个位置无处不在。如果用户不在浏览器上下文中，它们可以通过调用 `router.push()` 或 `router.replace()` 将该位置替换为启动位置。

**函数签名：**

```typescript
export declare function createMemoryHistory(base?: string): RouterHistory
```

### 参数

| 参数 | 类型     | 描述                           |
| ---- | -------- | ------------------------------ |
| base | `string` | Base 适用于所有 URL，默认为'/' |

### Returns

一个可以传递给路由构造函数的历史对象。

## NavigationFailureType

包含所有可能导航失败类型的枚举，可以传递给 [isNavigationFailure](#isnavigationfailure) 来检查某些特定类型的失败。**不要使用任何数值**，总是使用诸如 `NavigationFailureType.aborted` 这样的变量。

**函数签名：**

```typescript
export declare enum NavigationFailureType
```

### 成员

| 成员       | 值  | 描述                                                                     |
| ---------- | --- | ------------------------------------------------------------------------ |
| aborted    | 4   | 终止导航是指由于导航守卫返回 `false` 或调用 `next(false)` 而失败的导航。 |
| cancelled  | 8   | 取消导航是指由于最近的导航完成启动（不一定是完成）而失败的导航。         |
| duplicated | 16  | 重复导航是指在启动时已经在同一位置失败的导航。                           |

## START_LOCATION

- **类型**：[`RouteLocationNormalized`](#routelocationnormalized)
- **详细内容**：

  路由所在的初始路由地址。可用于导航守卫中，以区分初始导航。

  ```js
  import { START_LOCATION } from 'vue-router'

  router.beforeEach((to, from) => {
    if (from === START_LOCATION) {
      // 初始导航
    }
  })
  ```

## Composition API

### onBeforeRouteLeave

添加一个导航守卫，在当前位置的组件将要离开时触发。类似于 `beforeRouteLeave`，但它可以在任何组件中使用。当组件被卸载时，导航守卫将被移除。

**函数签名：**

```typescript
export declare function onBeforeRouteLeave(leaveGuard: NavigationGuard): void
```

#### 参数

| 参数       | 类型                                  | 描述             |
| ---------- | ------------------------------------- | ---------------- |
| leaveGuard | [`NavigationGuard`](#navigationguard) | 要添加的导航守卫 |

### onBeforeRouteUpdate

添加一个导航守卫，在当前位置即将更新时触发。类似于 `beforeRouteUpdate`，但它可以在任何组件中使用。当组件被卸载时，导航守卫将被移除。

**函数签名：**

```typescript
export declare function onBeforeRouteUpdate(updateGuard: NavigationGuard): void
```

#### 参数

| 参数        | 类型                                  | 描述             |
| ----------- | ------------------------------------- | ---------------- |
| updateGuard | [`NavigationGuard`](#navigationguard) | 要添加的导航守卫 |

### useLink

返回 [`v-slot` API](#router-link-s-v-slot) 暴露的所有内容。

**函数签名：**

```typescript
export declare function useLink(props: RouterLinkOptions): {
  route: ComputedRef<RouteLocationNormalized & { href: string }>,
  href: ComputedRef<string>,
  isActive: ComputedRef<boolean>,
  isExactActive: ComputedRef<boolean>,
  navigate: (event?: MouseEvent) => Promise(NavigationFailure | void),
}
```

#### 参数

| 参数  | 类型                | 描述                                                             |
| ----- | ------------------- | ---------------------------------------------------------------- |
| props | `RouterLinkOptions` | props 对象可以传递给`<router-link>`。接收 `Ref` 和 `ComputedRef` |

### useRoute

返回当前路由地址。相当于在模板中使用 `$route`。必须在 `setup()` 中调用。

**函数签名：**

```typescript
export declare function useRoute(): RouteLocationNormalized
```

### useRouter

返回 [router](#router-properties) 实例。相当于在模板中使用 `$router`。必须在 `setup()` 中调用。

**函数签名：**

```typescript
export declare function useRouter(): Router
```

## TypeScript

下面是 Vue Router 使用的一些接口和类型。文档引用它们是为了让你了解对象中现有的属性。

## Router 属性

### currentRoute

- **类型**：[`Ref<RouteLocationNormalized>`](#routelocationnormalized)
- **详细内容**：

  当前路由地址。只读的。

### options

- **类型**：[`RouterOptions`](#routeroptions)
- **详细内容**：

  创建 Router 时传递的原始配置对象。只读的。

## Router 方法

### addRoute

添加一条新的[路由记录](#routerecordraw)作为现有路由的子路由。如果路由有一个 `name`，并且已经有一个与之名字相同的路由，它会先删除之前的路由。

**函数签名：**

```typescript
addRoute(parentName: string | symbol, route: RouteRecordRaw): () => void
```

_参数_

| 参数       | 类型                                | 描述                                   |
| ---------- | ----------------------------------- | -------------------------------------- |
| parentName | `string \| symbol`                  | 父路由记录，`route` 应该被添加到的位置 |
| route      | [`RouteRecordRaw`](#routerecordraw) | 要添加的路由记录                       |

### addRoute

添加一条新的[路由记录](#routerecordraw)到路由。如果路由有一个 `name`，并且已经有一个与之名字相同的路由，它会先删除之前的路由。

**函数签名：**

```typescript
addRoute(route: RouteRecordRaw): () => void
```

_参数_

| 参数  | 类型                                | 描述             |
| ----- | ----------------------------------- | ---------------- |
| route | [`RouteRecordRaw`](#routerecordraw) | 要添加的路由记录 |

:::tip 提示
请注意，添加路由并不会触发新的导航。也就是说，除非触发新的导航，否则不会显示所添加的路由。
:::

### afterEach

添加一个导航钩子，在每次导航后执行。返回一个删除注册钩子的函数。

**函数签名：**

```typescript
afterEach(guard: NavigationHookAfter): () => void
```

_参数_

| 参数  | 类型                  | 描述             |
| ----- | --------------------- | ---------------- |
| guard | `NavigationHookAfter` | 要添加的导航钩子 |

#### 示例

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

### back

如果可能的话，通过调用 `history.back()` 回溯历史。相当于 `router.go(-1)`。

**函数签名：**

```typescript
back(): void
```

### beforeEach

添加一个导航守卫，在任何导航前执行。返回一个删除已注册守卫的函数。

**函数签名：**

```typescript
beforeEach(guard: NavigationGuard): () => void
```

_参数_

| 参数  | 类型                                  | 描述             |
| ----- | ------------------------------------- | ---------------- |
| guard | [`NavigationGuard`](#navigationguard) | 要添加的导航守卫 |

### beforeResolve

添加一个导航守卫，在导航即将解析之前执行。在这个状态下，所有的组件都已经被获取，并且其他导航守卫也已经成功。返回一个删除已注册守卫的函数。

**函数签名：**

```typescript
beforeResolve(guard: NavigationGuard): () => void
```

_参数_

| 参数  | 类型                                  | 描述             |
| ----- | ------------------------------------- | ---------------- |
| guard | [`NavigationGuard`](#navigationguard) | 要添加的导航守卫 |

#### 示例

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

### forward

如果可能的话，通过调用 `history.forward()` 在历史中前进。相当于 `router.go(1)`。

**函数签名：**

```typescript
forward(): void
```

### getRoutes

获取所有 [路由记录](#routerecordnormalized)的完整列表。

**函数签名：**

```typescript
getRoutes(): RouteRecord[]
```

### go

允许你在历史中前进或后退。

**函数签名：**

```typescript
go(delta: number): void
```

_参数_

| 参数  | 类型     | 描述                                 |
| ----- | -------- | ------------------------------------ |
| delta | `number` | 相对于当前页面，你要移动到的历史位置 |

### hasRoute

确认是否存在指定名称的路由。

**函数签名：**

```typescript
hasRoute(name: string | symbol): boolean
```

_参数_

| 参数 | 类型               | 描述             |
| ---- | ------------------ | ---------------- |
| name | `string \| symbol` | 要确认的路由名称 |

### isReady

当路由器完成初始化导航时，返回一个 Promise，这意味着它已经解析了所有与初始路由相关的异步输入钩子和异步组件。如果初始导航已经发生了，那么 promise 就会立即解析。这在服务器端渲染中很有用，可以确保服务器和客户端的输出一致。需要注意的是，在服务器端，你需要手动推送初始位置，而在客户端，路由器会自动从 URL 中获取初始位置。

**函数签名：**

```typescript
isReady(): Promise<void>
```

### onError

添加一个错误处理程序，在导航期间每次发生未捕获的错误时都会调用该处理程序。这包括同步和异步抛出的错误、在任何导航守卫中返回或传递给 `next` 的错误，以及在试图解析渲染路由所需的异步组件时发生的错误。

**函数签名：**

```typescript
onError(handler: (error: any, to: RouteLocationNormalized, from: RouteLocationNormalized) => any): () => void
```

_参数_

| 参数    | 类型                                                                              | 描述                      |
| ------- | --------------------------------------------------------------------------------- | ------------------------- |
| handler | `(error: any, to: RouteLocationNormalized, from: RouteLocationNormalized) => any` | 注册的错误处理程序 |

### push

通过在历史堆栈中推送一个 entry，以编程方式导航到一个新的 URL。

**函数签名：**

```typescript
push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

_参数_

| 参数 | 类型                                    | 描述               |
| ---- | --------------------------------------- | ------------------ |
| to   | [`RouteLocationRaw`](#routelocationraw) | 要导航到的路由地址 |

### removeRoute

通过名称删除现有路由。

**函数签名：**

```typescript
removeRoute(name: string | symbol): void
```

_参数_

| 参数 | 类型               | 描述             |
| ---- | ------------------ | ---------------- |
| name | `string \| symbol` | 要删除的路由名称 |

### replace

通过替换历史堆栈中的当前 entry，以编程方式导航到一个新的 URL。

**函数签名：**

```typescript
replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

_参数_

| 参数 | 类型                                    | 描述               |
| ---- | --------------------------------------- | ------------------ |
| to   | [`RouteLocationRaw`](#routelocationraw) | 要导航到的路由地址 |

### resolve

返回[路由地址](#routelocationraw)的[标准化版本](#routelocation)。还包括一个包含任何现有 `base` 的 `href` 属性。

**函数签名：**

```typescript
resolve(to: RouteLocationRaw): RouteLocation & {
  href: string
}
```

_参数_

| 参数 | 类型                                    | 描述                 |
| ---- | --------------------------------------- | -------------------- |
| to   | [`RouteLocationRaw`](#routelocationraw) | 要解析的原始路由地址 |

## RouterOptions

### history

用于路由实现历史记录。大多数 web 应用程序都应该使用 `createWebHistory`，但它要求正确配置服务器。你还可以使用 `createWebHashHistory` 的基于 _hash_ 的历史记录，它不需要在服务器上进行任何配置，但是搜索引擎根本不会处理它，在 SEO 上表现很差。

**函数签名：**

```typescript
history: RouterHistory
```

#### 示例

```js
createRouter({
  history: createWebHistory(),
  // 其他配置...
})
```

### linkActiveClass

用于激活的 [RouterLink](#router-link-props) 的默认类。如果什么都没提供，则会使用 `router-link-active`。

**函数签名：**

```typescript
linkActiveClass?: string
```

### linkExactActiveClass

用于精准激活的 [RouterLink](#router-link-props) 的默认类。如果什么都没提供，则会使用 `router-link-exact-active`。

**函数签名：**

```typescript
linkExactActiveClass?: string
```

### parseQuery

用于解析查询的自定义实现。必须解码查询键和值。参见对应的 [stringifyQuery](#stringifyquery)。

**函数签名：**

```typescript
parseQuery?: (searchQuery: string) => Record<string, (string | null)[] | string | null>
```

#### 示例

比方说，你想使用 [qs](https://github.com/ljharb/qs) 包来解析查询，你可以同时提供 `parseQuery` 和 `stringifyQuery`：

```js
import qs from 'qs'

createRouter({
  // 其他配置...
  parseQuery: qs.parse,
  stringifyQuery: qs.stringify,
})
```

### routes

应该添加到路由的初始路由列表。

**函数签名：**

```typescript
routes: RouteRecordRaw[]
```

### scrollBehavior

在页面之间导航时控制滚动的函数。可以返回一个 Promise 来延迟滚动。有关更多详细信息，请参见[滚动行为](../guide/advanced/scroll-behavior.md)。

**函数签名：**

```typescript
scrollBehavior?: RouterScrollBehavior
```

#### 示例

```js
function scrollBehavior(to, from, savedPosition) {
  // `to` 和 `from` 都是路由地址
  // `savedPosition` 可以为空，如果没有的话。
}
```

### stringifyQuery

对查询对象进行字符串化的自定义实现。不应该在前面加上 `?`。应该正确编码查询键和值。 [parseQuery](#parsequery) 对应于处理查询解析。

**函数签名：**

```typescript
stringifyQuery?: (
  query: Record<
    string | number,
    string | number | null | undefined | (string | number | null | undefined)[]
  >
) => string
```

## RouteRecordRaw

当用户通过 [`routes` option](#routeroptions) 或者 [`router.addRoute()`](#addroute) 来添加路由时，可以得到路由记录。 有三种不同的路由记录:

- 单一视图记录：有一个 `component` 配置
- 多视图记录 ([命名视图](../guide/essentials/named-views.md)) ：有一个 `components` 配置
- 重定向记录：没有 `component` 或 `components` 配置，因为重定向记录永远不会到达。

### path

- **类型**：`string`
- **详细内容**：

  记录的路径。应该以 `/` 开头，除非该记录是另一条记录的子记录。可以定义参数：`/users/:id` 匹配 `/users/1` 以及 `/users/posva`。

- **更多的内容请看**：[动态路由匹配](../guide/essentials/dynamic-matching.md)

### redirect

- **类型**：`RouteLocationRaw | (to: RouteLocationNormalized) => RouteLocationRaw` (可选)
- **详细内容**：

  如果路由是直接匹配的，那么重定向到哪里呢。重定向发生在所有导航守卫之前，并以新的目标位置触发一个新的导航。也可以是一个接收目标路由地址并返回我们应该重定向到的位置的函数。

### children

- **类型**：[`RouteRecordRaw`](#routerecordraw) 数组 (可选)
- **详细内容**：

  当前记录的嵌套路由。

- **更多的内容请看**：[Nested Routes](../guide/essentials/nested-routes.md)

### alias

- **类型**：`string | string[]` (可选)
- **详细内容**：

  路由的别名。允许定义类似记录副本的额外路由。这使得路由可以简写为像这种 `/users/:id` 和 `/u/:id`。 **所有的 `alias` 和 `path` 值必须共享相同的参数**。

### name

- **类型**：`string | symbol` (可选)
- **详细内容**：

  路由记录独一无二的名称。

### beforeEnter

- **类型**：[`NavigationGuard | NavigationGuard[]`](#navigationguard) (可选)
- **详细内容**：

  在进入特定于此记录的守卫之前。注意如果记录有`重定向`属性，则 `beforeEnter` 无效。

### props

- **类型**：`boolean | Record<string, any> | (to: RouteLocationNormalized) => Record<string, any>` (可选)
- **详细内容**：

  允许将参数作为 props 传递给由 `router-view` 渲染的组件。当传递给一个**多视图记录**时，它应该是一个与`组件`具有相同键的对象，或者是一个应用于每个组件的`布尔值`。

- **更多的内容请看**：[给路由组件传 props](../guide/essentials/passing-props.md)

### sensitive

- **类型**: `boolean` (可选) 
- **详细内容**: 

  使路由匹配区分大小写，默认为`false`。注意这也可以在路由级别上设置。

### strict

- **类型**: `boolean` (可选) 
- **详细内容**: 

  严格检查路径末尾是否有尾部斜线（`/`）。默认为 `false`，意味着默认情况下，路由 `/users` 同时匹配 `/users` 和 `/users/`。注意这也可以在路由级别上设置。

### meta

- **类型**：[`RouteMeta`](#routemeta) (可选)
- **详细内容**：

  在记录上附加自定义数据。

- **更多的内容请看**：[Meta 字段](../guide/advanced/meta.md)

:::tip 注意
如果你想使用函数式组件, 请确保在组件上添加一个 `displayName`。

例如:

```js
const HomeView = () => h('div', 'HomePage')
// 使用TypeScript时, 组件需要为 FunctionalComponent 类型
HomeView.displayName = 'HomeView'
const routes = [{ path: '/', component: HomeView }]
```

:::

## RouteRecordNormalized

[路由记录](#routerecordraw)的标准化版本

### aliasOf

- **类型**：`RouteRecordNormalized | undefined`
- **详细内容**：

  定义此记录是否是另一个记录的别名。如果该记录是原始记录，则此属性为 `undefined`。

### beforeEnter

- **类型**：[`NavigationGuard`](#navigationguard)
- **详细内容**：

  当从其他地方进入此记录时，导航守卫会被应用。

- **更多的内容请看**：[导航守卫](../guide/advanced/navigation-guards.md)

### children

- **类型**：标准化[路由记录](#routerecordnormalized)数组
- **详细内容**：

  路由被添加时的子路由记录。如果没有则为空数组。注意这个数组在 `addRoute()` 和 `removeRoute()` 被调用时不会更新。

### components

- **类型**：`Record<string, Component>`
- **详细内容**：

  命名视图的字典，如果没有，包含一个键为 `default` 的对象。

### meta

- **类型**：`RouteMeta`
- **详细内容**：

  附在记录上的任意数据。

- **更多的内容请看**：[Meta 字段](../guide/advanced/meta.md)

### name

- **类型**：`string | symbol | undefined`
- **详细内容**：

  路由记录的名称。如果什么都没提供，则为 `undefined`。

### path

- **类型**：`string`
- **详细内容**：

  路由记录的标准化路径。包括所有父级的 `path`。

### props

- **类型**：`Record<string, boolean | Function | Record<string, any>>`
- **详细内容**：

  每个命名视图的 [`props` 配置](#props)字典。如果没有，它将只包含一个名为 `default` 的属性。

### redirect

- **类型**：[`RouteLocationRaw`](#routelocationraw)
- **详细内容**：

  如果路由是直接匹配的，那么重定向到哪里呢。重定向发生在所有导航守卫之前，并触发一个带有新目标位置的新导航。

## RouteLocationRaw

用户级的路由地址，可以传递给 `router.push()`，`redirect`，并在[导航守卫](../guide/advanced/navigation-guards.md)中返回。

原始位置可以是一个 `字符串`，比如 `/users/posva#bio`，也可以是一个对象：

```js
// 这三种形式是等价的
router.push('/users/posva#bio')
router.push({ path: '/users/posva', hash: '#bio' })
router.push({ name: 'users', params: { username: 'posva' }, hash: '#bio' })
// 只改变 hash
router.push({ hash: '#bio' })
// 只改变 query
router.push({ query: { page: '2' } })
// 只改变 param
router.push({ params: { username: 'jolyne' } })
```

注意 `path` 必须以编码方式提供(例如，`phantom blood` 变为 `phantom%20blood`)。而 `params`、`query` 和 `hash` 一定不要这样，因为它们会被路由编码。

原始路由地址还支持一个额外的配置 `replace` 来调用导航守卫中的 `router.replace()`，而不是 `router.push()`。请注意，即使在调用 `router.push()`时，它也会在内部调用 `router.replace()` ：

```js
router.push({ hash: '#bio', replace: true })
// 相当于
router.replace({ hash: '#bio' })
```

## RouteLocation

可以包含[重定向记录](#routerecordraw)的解析的 [RouteLocationRaw](#routelocationraw)。除此之外，它还具有与 [RouteLocationNormalized](#routelocationnormalized) 相同的属性。

## RouteLocationNormalized

标准化的路由地址。没有任何[重定向记录](#routerecordraw)。在导航守卫中，`to` 和 `from` 总是属于这种类型。

### fullPath

- **类型**：`string`
- **详细内容**：

  URL 编码与路由地址有关。包括 `path`、 `query` 和 `hash`。

### hash

- **类型**：`string`
- **详细内容**：

  已解码 URL 的 `hash` 部分。总是以 `#`开头。如果 URL 中没有 `hash`，则为空字符串。

### query

- **类型**：`Record<string, string | string[]>`
- **详细内容**：

  从 URL 的 `search` 部分提取的已解码查询参数的字典。

### matched

- **类型**：[`RouteRecordNormalized[]`](#routerecordnormalized)
- **详细内容**：

  与给定路由地址匹配的[标准化的路由记录](#routerecord)数组。

### meta

- **类型**：`RouteMeta`
- **详细内容**：

  附加到从父级到子级合并（非递归）的所有匹配记录的任意数据。

- **更多的内容请看**：[Meta 字段](../guide/advanced/meta.md)

### name

- **类型**：`string | symbol | undefined | null`
- **详细内容**：

  路由记录的名称。如果什么都没提供，则为 `undefined`。

### params

- **类型**：`Record<string, string | string[]>`
- **详细内容**：

  从 `path` 中提取的已解码参数字典。

### path

- **类型**：`string`
- **详细内容**：

  编码 URL 的 `pathname` 部分，与路由地址有关。

### redirectedFrom

- **类型**：[`RouteLocation`](#routelocation)
- **详细内容**：

  在找到 `redirect` 配置或带有路由地址的名为 `next()` 的导航守卫时，我们最初尝试访问的路由地址，最后到达当前位置。如果没有重定向，则为 `undefined`。

## NavigationFailure

### from

- **类型**：[`RouteLocationNormalized`](#routelocationnormalized)
- **详细内容**：

  导航来的路由地址

### to

- **类型**：[`RouteLocationNormalized`](#routelocationnormalized)
- **详细内容**：

  导航去的路由地址

### type

- **类型**：[`NavigationFailureType`](#navigationfailuretype)
- **详细内容**：

  导航失败的类型

- **更多的内容请看**：[Navigation Failures](../guide/advanced/navigation-failures.md)

## NavigationGuard

- **Arguments**：

  - [`RouteLocationNormalized`](#routelocationnormalized) to - 我们要导航到的路由地址
  - [`RouteLocationNormalized`](#routelocationnormalized) from - 我们从哪里来的路由地址
  - `Function` next (可选) - 回调以验证导航

- **详细内容**：

  可以通过函数来控制路由导航。如果你返回一个值（或一个 Promise ），则可以省略 `next` 回调，并且我们鼓励这样做。可能的返回值 (和 `next`的参数) 有：

  - `undefined | void | true`: 验证导航
  - `false`: 取消导航
  - [`RouteLocationRaw`](#routelocationraw): 重定向到一个不同的位置
  - `(vm: ComponentPublicInstance) => any` **仅适用于 `beforeRouteEnter`**：导航完成后执行的回调。接收路由组件实例作为参数。

- **更多的内容请看**：[导航守卫](../guide/advanced/navigation-guards.md)

## Component Injections

### Component Injected 属性

这些属性通过调用 `app.use(router)` 注入到每个子组件中。

- **this.\$router**

  router 实例

- **this.\$route**

  当前激活的[路由地址](#routelocationnormalized)。这个属性是只读的，并且它的属性是不可改变的，但是它可以被观察。

### Component Enabled Options

- **beforeRouteEnter**
- **beforeRouteUpdate**
- **beforeRouteLeave**

请看[组件内的守卫](../guide/advanced/navigation-guards.md#组件内的守卫)。
