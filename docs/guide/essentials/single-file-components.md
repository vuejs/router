# Getting Started when using single file components

<VueSchoolLink
  href="https://vueschool.io/lessons/single-file-components"
  title="Getting started using the router in a build environment"
/>

Chances are that you are using vue with a build pipeline. Either `vite` the `vue cli` or a similar framework.
Getting started there is a little different.

## APP.vue

In your main component - usually `App.vue`, you will need specify where the component specified by the route will be injected. That is done with the `router-view` tag.
You will also want to replace any `a` tags used for internal navigation (routes that will be handled by the router) with `router-link` tags. This allows Vue Router to change the URL without reloading the page, handle URL generation as well as its encoding. We will see later how to benefit from these features.

```html
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
```

## Defining the routes

Usually in a separate file, often called `router/index.js` (but it could be right in your `main.js`). You need to create the mapping between routes and the components that should be displayed for each route.

```js
// 1. Import functions to create the router
import { createRouter, createWebHistory } from 'vue-router';
// 2. Import the components to display for each route
import Home from '../pages/Home.vue';
import About from '../pages/About.vue';

// 3. Define some routes
// Each route should map to a component.
// We'll talk about nested routes later.
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
]

// 4. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = createRouter({
  // 5. Provide the history implementation to use. 
  history: createWebHistory(),
  routes, // short for `routes: routes`
})

// 6. Export the router to use in `main.js` and anywhere else that you need access to the router.
export default router;
```

### main.js

```js
// 1. Import the router defined in your other file
import router from './router';

createApp(App)
// 2. Tell vue to use the router when handling route changes
.use(router)
.mount('#app')
```
