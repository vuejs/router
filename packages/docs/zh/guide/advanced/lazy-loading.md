# 路由懒加载

<VueSchoolLink
  href="https://vueschool.io/lessons/lazy-loading-routes-vue-cli-only"
  title="Learn about lazy loading routes"
/>

当打包构建应用时，JavaScript 包会变得非常大，影响页面加载。如果我们能把不同路由对应的组件分割成不同的代码块，然后当路由被访问的时候才加载对应组件，这样就会更加高效。

Vue Router 支持开箱即用的[动态导入](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)，这意味着你可以用动态导入代替静态导入：

```js
// 将
// import UserDetails from './views/UserDetails.vue'
// 替换成
const UserDetails = () => import('./views/UserDetails.vue')

const router = createRouter({
  // ...
  routes: [
    { path: '/users/:id', component: UserDetails }
    // 或在路由定义里直接使用它
    { path: '/users/:id', component: () => import('./views/UserDetails.vue') },
  ],
})
```

`component` (和 `components`) 配置接收一个返回组件 Promise 的函数，Vue Router **只会在首次进入页面时调用该函数**并获取其返回的 Promise 结果，此后则缓存并复用已解析完成的组件。这意味着你也可以使用更复杂的函数，只要它们返回一个 Promise：

```js
const UserDetails = () => Promise.resolve({/* 组件定义 */})
```

一般来说，对所有的路由**都使用动态导入**是个好主意。

如果你使用的是 Vite 或 webpack 之类的打包器，它会自动受益于[代码分割](https://webpack.js.org/guides/code-splitting/)。

<RuleKitLink />

## 与异步组件的关系

Vue Router 的懒加载可能看起来与 Vue 的[异步组件](https://cn.vuejs.org/guide/components/async.html)相似，但它们是不同的特性。**不要**将异步组件用作路由组件。异步组件仍然可以在路由组件内部使用，但路由组件本身应该只是一个函数。

## 与函数式组件的关系

虽然不常见，但将[函数式组件](https://cn.vuejs.org/guide/extras/render-function.html#functional-components)用作路由组件也是可以的。然而，Vue Router 需要某种方式来区分函数式组件和懒加载。要使用函数式组件，我们必须给这个函数设置一个 `displayName`：

```ts
const AboutPage: FunctionalComponent = () => {
  return h('h1', {}, 'About')
}
AboutPage.displayName = 'AboutPage'
```

## 把组件按组分块

我们可能想把同一个路由下嵌套的所有组件都分组到同一个块中，让它们可以通过一次请求全部加载。

### 使用 Vite

我们可以在 [`rollupOptions`](https://cn.vite.dev/config/build-options.html#build-rollupoptions) 下定义分块：

```js [vite.config.js]
export default defineConfig({
  build: {
    rollupOptions: {
      // https://rollupjs.org/guide/en/#outputmanualchunks
      output: {
        manualChunks: {
          'group-user': [
            './src/UserDetails',
            './src/UserDashboard',
            './src/UserProfileEdit',
          ],
        },
      },
    },
  },
})
```

### 使用 webpack

我们可以使用一种特殊的注释语法来指定[块名称](https://webpack.js.org/api/module-methods/#webpackchunkname)：

```js
const UserDetails = () =>
  import(/* webpackChunkName: "group-user" */ './UserDetails.vue')
const UserDashboard = () =>
  import(/* webpackChunkName: "group-user" */ './UserDashboard.vue')
const UserProfileEdit = () =>
  import(/* webpackChunkName: "group-user" */ './UserProfileEdit.vue')
```

webpack 会将任何一个异步模块与相同的块名称组合到相同的异步块中。
