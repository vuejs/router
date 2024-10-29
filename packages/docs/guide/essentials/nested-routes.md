# Nested Routes

<VueSchoolLink
  href="https://vueschool.io/lessons/nested-routes"
  title="Learn about nested routes"
/>

Some applications' UIs are composed of components that are nested multiple levels deep. In this case, it is very common that the segments of a URL correspond to a certain structure of nested components, for example:

```
/user/johnny/profile                   /user/johnny/posts 
┌──────────────────┐                  ┌──────────────────┐
│ User             │                  │ User             │
│ ┌──────────────┐ │                  │ ┌──────────────┐ │
│ │ Profile      │ │  ●────────────▶  │ │ Posts        │ │
│ │              │ │                  │ │              │ │
│ └──────────────┘ │                  │ └──────────────┘ │
└──────────────────┘                  └──────────────────┘
```

With Vue Router, you can express this relationship using nested route configurations.

Given the app we created in the last chapter:

```vue
<!-- App.vue -->
<template>
  <router-view />
</template>
```

```vue
<!-- User.vue -->
<template>
  <div>
    User {{ $route.params.id }}
  </div>
</template>
```

```js
import User from './User.vue'

// these are passed to `createRouter`
const routes = [{ path: '/user/:id', component: User }]
```

The `<router-view>` here is a top-level `router-view`. It renders the component matched by a top level route. Similarly, a rendered component can also contain its own, nested `<router-view>`. For example, if we add one inside the `User` component's template:

```vue
<!-- User.vue -->
<template>
  <div class="user">
    <h2>User {{ $route.params.id }}</h2>
    <router-view />
  </div>
</template>
```

To render components into this nested `router-view`, we need to use the `children` option in any of the routes:

```js
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      {
        // UserProfile will be rendered inside User's <router-view>
        // when /user/:id/profile is matched
        path: 'profile',
        component: UserProfile,
      },
      {
        // UserPosts will be rendered inside User's <router-view>
        // when /user/:id/posts is matched
        path: 'posts',
        component: UserPosts,
      },
    ],
  },
]
```

**Note that nested paths that start with `/` will be treated as root paths. This allows you to leverage the component nesting without having to use a nested URL.**

As you can see, the `children` option is just another Array of routes like `routes` itself. Therefore, you can keep nesting views as much as you need.

At this point, with the above configuration, when you visit `/user/eduardo`, nothing will be rendered inside `User`'s `router-view`, because no nested route is matched. Maybe you do want to render something there. In such case you can provide an empty nested path:

```js
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      // UserHome will be rendered inside User's <router-view>
      // when /user/:id is matched
      { path: '', component: UserHome },

      // ...other sub routes
    ],
  },
]
```

A working demo of this example can be found [here](https://codesandbox.io/s/nested-views-vue-router-4-examples-hl326?initialpath=%2Fusers%2Feduardo).

## Nested Named Routes

When dealing with [Named Routes](./named-routes.md), you usually **name the children routes**:

```js
const routes = [
  {
    path: '/user/:id',
    component: User,
    // notice how only the child route has a name
    children: [{ path: '', name: 'user', component: UserHome }],
  },
]
```

This will ensure navigating to `/user/:id` will always display the nested route.

In some scenarios, you may want to navigate to a named route without navigating to the nested route. For example, if you want to navigate to `/user/:id` without displaying the nested route. In that case, you can **also** name the parent route but note **that reloading the page will always display the nested child** as it's considered a navigation to the path `/users/:id` instead of the named route:

```js
const routes = [
  {
    path: '/user/:id',
    name: 'user-parent',
    component: User,
    children: [{ path: '', name: 'user', component: UserHome }],
  },
]
```

## Omitting parent components <Badge text="4.1+" />

We can also take advantage of the parent-child relationship between routes without needing to nest route components. This can be useful for grouping together routes with a common path prefix, or when working with more advanced features, such as [per-route navigation guards](../advanced/navigation-guards#Per-Route-Guard) or [route meta fields](../advanced/meta).

To achieve this, we omit the `component` and `components` options from the parent route:

```js
const routes = [
  {
    path: '/admin',
    children: [
      { path: '', component: AdminOverview },
      { path: 'users', component: AdminUserList },
      { path: 'users/:id', component: AdminUserDetails },
    ], 
  },
]
```

As the parent doesn't specify a route component, the top-level `<router-view>` will skip over the parent and just use the component from the relevant child instead.
