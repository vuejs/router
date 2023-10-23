# Lazy Loading Routes

<VueSchoolLink
  href="https://vueschool.io/lessons/lazy-loading-routes-vue-cli-only"
  title="Learn about lazy loading routes"
/>

When building apps with a bundler, the JavaScript bundle can become quite large, and thus affect the page load time. It would be more efficient if we can split each route's components into separate chunks, and only load them when the route is visited.

Vue Router supports [dynamic imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) out of the box, meaning you can replace static imports with dynamic ones:

```js
// replace
// import UserDetails from './views/UserDetails'
// with
const UserDetails = () => import('./views/UserDetails.vue')

const router = createRouter({
  // ...
  routes: [
    { path: '/users/:id', component: UserDetails }
    // or use it directly in the route definition
    { path: '/users/:id', component: () => import('./views/UserDetails.vue') },
  ],
})
```

The `component` (and `components`) option accepts a function that returns a Promise of a component and Vue Router **will only fetch it when entering the page for the first time**, then use the cached version. Which means you can also have more complex functions as long as they return a Promise:

```js
const UserDetails = () =>
  Promise.resolve({
    /* component definition */
  })
```

In general, it's a good idea **to always use dynamic imports** for all your routes.

::: tip Note
Do **not** use [Async components](https://v3.vuejs.org/guide/component-dynamic-async.html#async-components) for routes. Async components can still be used inside route components but route component themselves are just dynamic imports.
:::

When using a bundler like webpack, this will automatically benefit from [code splitting](https://webpack.js.org/guides/code-splitting/)

When using Babel, you will need to add the [syntax-dynamic-import](https://babeljs.io/docs/plugins/syntax-dynamic-import/) plugin so that Babel can properly parse the syntax.

## Grouping Components in the Same Chunk

### With webpack

Sometimes we may want to group all the components nested under the same route into the same async chunk. To achieve that we need to use [named chunks](https://webpack.js.org/guides/code-splitting/#dynamic-imports) by providing a chunk name using a special comment syntax (requires webpack > 2.4):

```js
const UserDetails = () =>
  import(/* webpackChunkName: "group-user" */ './UserDetails.vue')
const UserDashboard = () =>
  import(/* webpackChunkName: "group-user" */ './UserDashboard.vue')
const UserProfileEdit = () =>
  import(/* webpackChunkName: "group-user" */ './UserProfileEdit.vue')
```

webpack will group any async module with the same chunk name into the same async chunk.

### With Vite

In Vite you can define the chunks under the [`rollupOptions`](https://vitejs.dev/config/#build-rollupoptions):

```js
// vite.config.js
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
