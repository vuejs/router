# Lazy Loading Routes

When building apps with a bundler, the JavaScript bundle can become quite large, and thus affect the page load time. It would be more efficient if we can split each route's components into a separate chunk, and only load them when the route is visited.

<!-- TODO: fix links -->

TODO: make it clear that this also works with other bundlers, not only with webpack

Combining Vue's [async component feature](https://vuejs.org/guide/components.html#Async-Components) and webpack's [code splitting feature](https://webpack.js.org/guides/code-splitting-async/), it's trivially easy to lazy-load route components.

First, an async component can be defined as a factory function that returns a Promise (which should resolve to the component itself):

```js
const UserDetails = () =>
  Promise.resolve({
    /* component definition */
  })
```

Second, in webpack 2, we can use the [dynamic import](https://github.com/tc39/proposal-dynamic-import) syntax to indicate a code-split point:

```js
import('./UserDetails.vue') // returns a Promise
```

::: tip Note
if you are using Babel, you will need to add the [syntax-dynamic-import](https://babeljs.io/docs/plugins/syntax-dynamic-import/) plugin so that Babel can properly parse the syntax.
:::

Combining the two, this is how to define an async component that will be automatically code-split by webpack:

```js
const UserDetails = () => import('./UserDetails.vue')
```

Nothing needs to change in the route config, just use `UserDetails` as usual:

```js
const router = createRouter({
  routes: [{ path: '/users/:id', component: UserDetails }]
})
```

## Grouping Components in the Same Chunk

Sometimes we may want to group all the components nested under the same route into the same async chunk. To achieve that we need to use [named chunks](https://webpack.js.org/guides/code-splitting-async/#chunk-names) by providing a chunk name using a special comment syntax (requires webpack > 2.4):

```js
const UserDetails = () =>
  import(/* webpackChunkName: "group-user" */ './UserDetails.vue')
const UserDashboard = () =>
  import(/* webpackChunkName: "group-user" */ './UserDashboard.vue')
const UserProfileEdit = () =>
  import(/* webpackChunkName: "group-user" */ './UserProfileEdit.vue')
```

webpack will group any async module with the same chunk name into the same async chunk.
