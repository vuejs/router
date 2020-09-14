# Redirect and Alias

## Redirect

Redirecting is also done in the `routes` configuration. To redirect from `/a` to `/b`:

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

Note that **[Navigation Guards](../advanced/navigation-guards.md) are not applied on the route that redirects, only on its target**. e.g. In the example below, adding a `beforeEnter` guard to the `/home` route would not have any effect.

### Relative redirecting

It's also possible to redirect to a relative location:

```js
const routes = [
  {
    path: '/users/:id/posts',
    redirect: to => {
      // the function receives the target route as the argument
      // return redirect path/location here.
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

**Note about SEO**: when using aliases, make sure to define canonical links: https://support.google.com/webmasters/answer/139066?hl=en.
