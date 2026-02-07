# Lazy Loading Routes

<VueSchoolLink
  href="https://vueschool.io/lessons/lazy-loading-routes-vue-cli-only"
  title="Learn about lazy loading routes"
/>

When building apps with a bundler, the JavaScript bundle can become quite large, and thus affect the page load time. It would be more efficient if we can split each route's components into separate chunks, and only load them when the route is visited.

Vue Router supports [dynamic imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) out of the box, meaning you can replace static imports with dynamic ones:

```js
// replace
// import UserDetails from './views/UserDetails.vue'
// with
const UserDetails = () => import('./views/UserDetails.vue')

const router = createRouter({
  // ...
  routes: [
    { path: '/users/:id', component: UserDetails },
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

When using a bundler like Vite or webpack, this will automatically benefit from [code splitting](https://webpack.js.org/guides/code-splitting/).

<RuleKitLink />

## Relationship to async components

Vue Router's lazy loading may appear similar to Vue's [async components](https://vuejs.org/guide/components/async.html), but they are distinct features. Do **not** use async components as route components. An async component can still be used inside a route component but the route component itself should just be a function.

## Relationship to functional components

While not common, it is possible to use a [functional component](https://vuejs.org/guide/extras/render-function.html#functional-components) as a route component. However, Vue Router needs some way to differentiate between functional components and lazy loading. To use a functional component we must give the function a `displayName`:

```ts
const AboutPage: FunctionalComponent = () => {
  return h('h1', {}, 'About')
}
AboutPage.displayName = 'AboutPage'
```

## Grouping Components in the Same Chunk

We may want to group all the components nested under the same route into the same chunk, so they can all be loaded with a single request.

### With Vite

We can define the chunks under the [`rollupOptions`](https://vite.dev/config/build-options.html#build-rollupoptions):

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

### With webpack

We can specify the [chunk name](https://webpack.js.org/api/module-methods/#webpackchunkname) using a special comment syntax:

```js
const UserDetails = () =>
  import(/* webpackChunkName: "group-user" */ './UserDetails.vue')
const UserDashboard = () =>
  import(/* webpackChunkName: "group-user" */ './UserDashboard.vue')
const UserProfileEdit = () =>
  import(/* webpackChunkName: "group-user" */ './UserProfileEdit.vue')
```

webpack will group any async module with the same chunk name into the same async chunk.
