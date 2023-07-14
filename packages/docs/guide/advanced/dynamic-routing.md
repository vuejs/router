# Dynamic Routing

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-dynamic-routing"
  title="Learn how to add routes at runtime"
/>

Adding routes to your router is usually done via the [`routes` option](../../api/#routes) but in some situations, you might want to add or remove routes while the application is already running. Application with extensible interfaces like [Vue CLI UI](https://cli.vuejs.org/dev-guide/ui-api.html) can use this to make the application grow.

## Adding Routes

Dynamic routing is achieved mainly via two functions: `router.addRoute()` and `router.removeRoute()`. They **only** register a new route, meaning that if the newly added route matches the current location, it would require you to **manually navigate** with `router.push()` or `router.replace()` to display that new route. Let's take a look at an example:

Imagine having the following router with one single route:

```js
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:articleName', component: Article }],
})
```

Going to any page, `/about`, `/store`, or `/3-tricks-to-improve-your-routing-code` ends up rendering the `Article` component. If we are on `/about` and we add a new route:

```js
router.addRoute({ path: '/about', component: About })
```

The page will still show the `Article` component, we need to manually call `router.replace()` to change the current location and overwrite where we were (instead of pushing a new entry, ending up in the same location twice in our history):

```js
router.addRoute({ path: '/about', component: About })
// we could also use this.$route or route = useRoute() (inside a setup)
router.replace(router.currentRoute.value.fullPath)
```

Remember you can `await router.replace()` if you need to wait for the new route to be displayed.

## Adding Routes inside navigation guards

If you decide to add or remove routes inside of a navigation guard, you should not call `router.replace()` but trigger a redirection by returning the new location:

```js
router.beforeEach(to => {
  if (!hasNecessaryRoute(to)) {
    router.addRoute(generateRoute(to))
    // trigger a redirection
    return to.fullPath
  }
})
```

The example above assumes two things: first, the newly added route record will match the `to` location, effectively resulting in a different location from the one we were trying to access. Second, `hasNecessaryRoute()` returns `false` after adding the new route to avoid an infinite redirection.

Because we are redirecting, we are replacing the ongoing navigation, effectively behaving like the example shown before. In real world scenarios, adding is more likely to happen outside of navigation guards, e.g. when a view component mounts, it register new routes.

## Removing routes

There are few different ways to remove existing routes:

- By adding a route with a conflicting name. If you add a route that has the same name as an existing route, it will remove the route first and then add the route:

  ```js
  router.addRoute({ path: '/about', name: 'about', component: About })
  // this will remove the previously added route because they have
  // the same name and names are unique across all routes
  router.addRoute({ path: '/other', name: 'about', component: Other })
  ```

- By calling the callback returned by `router.addRoute()`:

  ```js
  const removeRoute = router.addRoute(routeRecord)
  removeRoute() // removes the route if it exists
  ```

  This is useful when the routes do not have a name
- By using `router.removeRoute()` to remove a route by its name:

  ```js
  router.addRoute({ path: '/about', name: 'about', component: About })
  // remove the route
  router.removeRoute('about')
  ```

  Note you can use `Symbol`s for names in routes if you wish to use this function but want to avoid conflicts in names.

Whenever a route is removed, **all of its aliases and children** are removed with it.

## Adding nested routes

To add nested routes to an existing route, you can pass the _name_ of the route as its first parameter to `router.addRoute()`, this will effectively add the route as if it was added through `children`:

```js
router.addRoute({ name: 'admin', path: '/admin', component: Admin })
router.addRoute('admin', { path: 'settings', component: AdminSettings })
```

This is equivalent to:

```js
router.addRoute({
  name: 'admin',
  path: '/admin',
  component: Admin,
  children: [{ path: 'settings', component: AdminSettings }],
})
```

## Looking at existing routes

Vue Router gives you two functions to look at existing routes:

- [`router.hasRoute()`](/api/interfaces/Router.md#Methods-hasRoute): check if a route exists
- [`router.getRoutes()`](/api/interfaces/Router.md#Methods-getRoutes): get an array with all the route records.
