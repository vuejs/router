# File Conventions

The file-based routing is as close as possible to [Nuxt](https://nuxt.com/docs/guide/directory-structure/pages).

## Routes folder structure

By default, this plugin checks the folder at `src/pages` for any `.vue` files and generates the corresponding routing structure based on the file name. This way, you no longer need to maintain a `routes` array when adding routes to your application, **instead just add the new `.vue` component to the routes folder and let the plugin do the rest!**

Let's take a look at a simple example:

```text
src/pages/
├── index.vue
├── about.vue
└── users/
    ├── index.vue
    └── [id].vue
```

This will generate the following routes:

- `/`: -> renders the `index.vue` component
- `/about`: -> renders the `about.vue` component
- `/users`: -> renders the `users/index.vue` component
- `/users/:id`: -> renders the `users/[id].vue` component. `id` becomes a route param.

### Index Routes

Any `index.vue` (**must be all lowercase**) file will generate an empty path (similar to `index.html` files):

- `src/pages/index.vue`: generates a `/` route
- `src/pages/users/index.vue`: generates a `/users` route

### Nested Routes

Nested routes are automatically defined by defining a `.vue` file alongside a folder **with the same name**. If you create both a `src/pages/users/index.vue` and a `src/pages/users.vue` components, the `src/pages/users/index.vue` will be rendered within the `src/pages/users.vue`'s `<RouterView>`.

In other words, given this folder structure:

```text
src/pages/
├── users/
│   └── index.vue
└── users.vue
```

You will get this `routes` array:

```js
const routes = [
  {
    path: '/users',
    component: () => import('src/pages/users.vue'),
    children: [
      { path: '', component: () => import('src/pages/users/index.vue') },
    ],
  },
]
```

While omitting the `src/pages/users.vue` component will generate the following routes:

```js
const routes = [
  {
    path: '/users',
    // notice how there is no component here
    children: [
      { path: '', component: () => import('src/pages/users/index.vue') },
    ],
  },
]
```

Note the folder and file's name `users/` could be any valid naming like `my-[id]-param/`.

#### Nested routes without nesting layouts

Sometimes you might want to add _nesting to the URL_ in the form of slashes but you don't want it to impact your UI hierarchy. Consider the following folder structure:

```text
src/pages/
├── users/
│   ├── [id].vue
│   └── index.vue
└── users.vue
```

If you want to add a new route `/users/create` you could add a new file `src/pages/users/create.vue` but that would nest the `create.vue` component within the `users.vue` component. To avoid this you can instead create a file `src/pages/users.create.vue`. The `.` will become a `/` when generating the routes:

```js
const routes = [
  {
    path: '/users',
    component: () => import('src/pages/users.vue'),
    children: [
      { path: '', component: () => import('src/pages/users/index.vue') },
      { path: ':id', component: () => import('src/pages/users/[id].vue') },
    ],
  },
  {
    path: '/users/create',
    component: () => import('src/pages/users.create.vue'),
  },
]
```

### Named routes

All generated routes that have a `component` property will have a `name` property. This avoids accidentally directing your users to a parent route. By default, names are generated using the file path, but you can override this behavior by passing a custom `getRouteName()` function. You will get TypeScript validation almost everywhere, so changing this should be easy.

## Route groups

Sometimes, it helps to organize your file structure in a way that doesn't change the URL of your routes. Route groups let you organize your routes logically, in a way that makes sense to you, without affecting the actual URLs. For example, if you have several routes that share the same layout, you can group them together using route groups. Consider the following file structure:

```text
src/pages/
├── (admin)/
│   ├── dashboard.vue
│   └── settings.vue
└── (user)/
    ├── profile.vue
    └── order.vue
```

Resulting URLs:

```text
- `/dashboard` -> renders `src/pages/(admin)/dashboard.vue`
- `/settings` -> renders `src/pages/(admin)/settings.vue`
- `/profile` -> renders `src/pages/(user)/profile.vue`
- `/order` -> renders `src/pages/(user)/order.vue`
```

This approach allows you to organize your files for better maintainability without changing the structure of your application's routes.

You can also use route groups in page components. This is equivalent to naming the page component `index.vue`:

```text
src/pages/
└─── admin/
    ├── (dashboard).vue // Becomes index.vue of admin route
    └── settings.vue
```

## Named views

It is possible to define [named views](https://router.vuejs.org/guide/essentials/named-views.html#named-views) by appending an `@` + a name to their filename, e.g. a file named `src/pages/index@aux.vue` will generate a route of:

```js
{
  path: '/',
  component: {
    aux: () => import('src/pages/index@aux.vue')
  }
}
```

Note that by default a non named route is named `default` and that you don't need to name your file `index@default.vue` even if there are other named views (e.g. having `index@aux.vue` and `index.vue` is the same as having `index@aux.vue` and `index@default.vue`).

## Dynamic Routes

You can add [route params](https://router.vuejs.org/guide/essentials/dynamic-matching.html) by wrapping the _param name_ with brackets, e.g. `src/pages/users/[id].vue` will create a route with the following path: `/users/:id`. Note you can add a param in the middle in between static segments: `src/pages/users_[id].vue` -> `/users_:id`. You can even add multiple params: `src/pages/product_[skuId]_[seoDescription].vue`.

You can create [**optional params**](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#optional-parameters) by wrapping the _param name_ with an extra pair of brackets, e.g. `src/pages/users/[[id]].vue` will create a route with the following path: `/users/:id?`.

You can create [**repeatable params**](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#repeatable-params) by adding a plus character (`+`) after the closing bracket, e.g. `src/pages/articles/[slugs]+.vue` will create a route with the following path: `/articles/:slugs+`.

And you can combine both to create optional repeatable params, e.g. `src/pages/articles/[[slugs]]+.vue` will create a route with the following path: `/articles/:slugs*`.

## Catch all / 404 Not found route

To create a catch all route prepend 3 dots (`...`) to the param name, e.g. `src/pages/[...path].vue` will create a route with the following path: `/:path(.*)`. This will match any route. Note this can be done inside a folder too, e.g. `src/pages/articles/[...path].vue` will create a route with the following path: `/articles/:path(.*)`.

## Multiple routes folders

It's possible to provide multiple routes folders by passing an array to `routesFolder`:

```js
VueRouter({
  routesFolder: ['src/pages', 'src/admin/routes'],
})
```

You can also provide a path prefix for each of these folders, it will be used _as is_, and **cannot start with a `/`** but can contain any params you want or even **not finish with a `/`**:

```ts
import VueRouter from 'vue-router/vite'

VueRouter({
  routesFolder: [
    'src/pages',
    {
      src: 'src/admin/routes',
      // note there is always a trailing slash and never a leading one
      path: 'admin/',
      // src/admin/routes/dashboard.vue -> /admin/dashboard
    },
    {
      src: 'src/docs',
      // you can add parameters
      path: 'docs/:lang/',
      // src/docs/introduction.vue -> /docs/:lang/introduction
    },
    {
      src: 'src/promos',
      // you can omit the trailing slash
      path: 'promos-',
      // src/promos/black-friday.vue -> /promos-black-friday
    },
  ],
})
```

Note that the provided folders must be separate and one _route folder_ cannot contain another specified _route folder_. If you need further customization, give [definePage()](./extending-routes#definepage) a try.

## Custom extensions

While most of the time you will be using `.vue` files, you can also specify custom extensions to be considered as pages. You can for example use _markdown_ files as pages:

```ts
import VueRouter from 'vue-router/vite'

VueRouter({
  // globally set the extensions
  extensions: ['.vue', '.md'],
  routesFolder: [
    'src/pages',
    {
      src: 'src/docs',
      // override the global extensions to **only** accept markdown files
      extensions: ['.md'],
    },
  ],
})
```

In this scenario, files named `index.md` (**must be all lowercase**) will generate an empty path like `index.vue` files.
