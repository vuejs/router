# Getting Started

::: tip Note
We will be using [ES2015](https://github.com/lukehoban/es6features) in the code samples in the guide.

Also, all examples will be using the full version of Vue to make on-the-fly template compilation possible. See more details [here](https://v3.vuejs.org/guide/installation.html#runtime-compiler-vs-runtime-only).
:::

Creating a Single-page Application with Vue + Vue Router is dead simple. With Vue.js, we are already composing our application with components. When adding Vue Router to the mix, all we need to do is map our components to the routes and let Vue Router know where to render them. Here's a basic example:

## HTML

```html
<script src="https://unpkg.com/vue@next"></script>
<script src="https://unpkg.com/vue-router@next"></script>

<div id="app">
  <h1>Hello App!</h1>
  <p>
    <!-- use the router-link component for navigation. -->
    <!-- specify the link by passing the `to` prop. -->
    <!-- `<router-link>` will render an `<a>` tag with the correct `href` attribute -->
    <router-link to="/">Go to Home</router-link>
    <router-link to="/about">Go to About</router-link>
  </p>
  <!-- route outlet -->
  <!-- component matched by the route will render here -->
  <router-view></router-view>
</div>
```

### `router-link`

Note how instead of using regular `a` tags, we use a custom component `router-link` to create links. This allows Vue Router to change the URL without reloading the page, handle URL generation as well as its encoding. We will see later how to benefit from these features.

### `router-view`

`router-view` will display the component that corresponds to the url. You can put it anywhere to adapt it to your layout.

## JavaScript

```js
// 1. Define route components.
// These can be imported from other files
const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

// 2. Define some routes
// Each route should map to a component.
// We'll talk about nested routes later.
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
]

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = VueRouter.createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: VueRouter.createWebHashHistory(),
  routes, // short for `routes: routes`
})

// 4. Create and mount the root instance.
const app = Vue.createApp({})
// Make sure to _use_ the router instance to make the
// whole app router-aware.
app.use(router)

app.mount('#app')

// Now the app has started!
```

By calling `app.use(router)`, we get access to it as `this.$router` as well as the current route as `this.$route` inside of any component:

```js
// Home.vue
export default {
  computed: {
    username() {
      // We will see what `params` is shortly
      return this.$route.params.username
    },
  },
  methods: {
    goToDashboard() {
      if (isAuthenticated) {
        this.$router.push('/dashboard')
      } else {
        this.$router.push('/login')
      }
    },
  },
}
```

To access the router or the route inside the `setup` function, call the `useRouter` or `useRoute` functions. We will learn more about this in [the Composition API](/guide/advanced/composition-api.md#accessing-the-router-and-current-route-inside-setup)

Throughout the docs, we will often use the `router` instance. Keep in mind that `this.$router` is exactly the same as directly using the `router` instance created through `createRouter`. The reason we use `this.$router` is because we don't want to import the router in every single component that needs to manipulate routing.
