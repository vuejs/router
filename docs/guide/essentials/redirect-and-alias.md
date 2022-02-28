# Redirect and Alias

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-redirect-and-alias"
  title="Learn how to use redirect and alias"
/>

## Redirect

Redirecting is also done in the `routes` configuration. To redirect from `/home` to `/`:

```js
const routes = [{ path: '/home', redirect: '/' }]
```

The redirect can also be targeting a named route:

```js
const routes = [{ path: '/home', redirect: { name: 'homepage' } }]
```

Or even use a function for dynamic redirecting:

```js
const routes = [
  {
    // /search/screens -> /search?q=screens
    path: '/search/:searchText',
    redirect: to => {
      // the function receives the target route as the argument
      // we return a redirect path/location here.
      return { path: '/search', query: { q: to.params.searchText } }
    },
  },
  {
    path: '/search',
    // ...
  },
]
```

Note that **[Navigation Guards](../advanced/navigation-guards.md) are not applied on the route that redirects, only on its target**. e.g. In the above example, adding a `beforeEnter` guard to the `/home` route would not have any effect.

When writing a `redirect`, you can omit the `component` option because it is never directly reached so there is no component to render. The only exception are [nested routes](./nested-routes.md): if a route record has `children` and a `redirect` property, it should also have a `component` property.

### Relative redirecting

It's also possible to redirect to a relative location:

```js
const routes = [
  {
    // will always redirect /users/123/posts to /users/123/profile
    path: '/users/:id/posts',
    redirect: to => {
      // the function receives the target route as the argument
      // a relative location doesn't start with `/`
      // or { path: 'profile'}
      return 'profile'
    },
  },
]
```

## Alias

A redirect means when the user visits `/home`, the URL will be replaced by `/`, and then matched as `/`. But what is an alias?

**An alias of `/` as `/home` means when the user visits `/home`, the URL remains `/home`, but it will be matched as if the user is visiting `/`.**

The above can be expressed in the route configuration as:

```js
const routes = [{ path: '/', component: Homepage, alias: '/home' }]
```

An alias gives you the freedom to map a UI structure to an arbitrary URL, instead of being constrained by the configuration's nesting structure. Make the alias start with a `/` to make the path absolute in nested routes. You can even combine both and provide multiple aliases with an array:

```js
const routes = [
  {
    path: '/users',
    component: UsersLayout,
    children: [
      // this will render the UserList for these 3 URLs
      // - /users
      // - /users/list
      // - /people
      { path: '', component: UserList, alias: ['/people', 'list'] },
    ],
  },
]
```

If your route has parameters, make sure to include them in any absolute alias:

```js
const routes = [
  {
    path: '/users/:id',
    component: UsersByIdLayout,
    children: [
      // this will render the UserDetails for these 3 URLs
      // - /users/24
      // - /users/24/profile
      // - /24
      { path: 'profile', component: UserDetails, alias: ['/:id', ''] },
    ],
  },
]
```

**Note about SEO**: when using aliases, make sure to [define canonical links](https://support.google.com/webmasters/answer/139066?hl=en).
