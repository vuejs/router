# Typed Routes <Badge type="tip" text="v4.4.0+" />

![RouterLink to autocomplete](https://user-images.githubusercontent.com/664177/176442066-c4e7fa31-4f06-4690-a49f-ed0fd880dfca.png)

It's possible to configure the router to have a _map_ of typed routes. While this can be done manually, it is recommended to use the [unplugin-vue-router](https://github.com/posva/unplugin-vue-router) plugin to generate the routes and the types automatically.

## Manual Configuration

Here is an example of how to manually configure typed routes:

```ts
// import the `RouteRecordInfo` type from vue-router to type your routes
import type { RouteRecordInfo } from 'vue-router'

// Define an interface of routes
export interface RouteNamedMap {
  // each key is a name
  home: RouteRecordInfo<
    // here we have the same name
    'home',
    // this is the path, it will appear in autocompletion
    '/',
    // these are the raw params (what can be passed to router.push() and RouterLink's "to" prop)
    // In this case, there are no params allowed
    Record<never, never>,
    // these are the normalized params (what you get from useRoute())
    Record<never, never>,
    // this is a union of all children route names, in this case, there are none
    never
  >
  // repeat for each route...
  // Note you can name them whatever you want
  'named-param': RouteRecordInfo<
    'named-param',
    '/:name',
    { name: string | number }, // Allows string or number
    { name: string }, // but always returns a string from the URL
    'named-param-edit'
  >
  'named-param-edit': RouteRecordInfo<
    'named-param-edit',
    '/:name/edit',
    { name: string | number }, // we also include parent params
    { name: string },
    never
  >
  'article-details': RouteRecordInfo<
    'article-details',
    '/articles/:id+',
    { id: Array<number | string> },
    { id: string[] },
    never
  >
  'not-found': RouteRecordInfo<
    'not-found',
    '/:path(.*)',
    { path: string },
    { path: string },
    never
  >
}

// Last, you will need to augment the Vue Router types with this map of routes
declare module 'vue-router' {
  interface TypesConfig {
    RouteNamedMap: RouteNamedMap
  }
}
```

::: tip

This is indeed tedious and error-prone. That's why it's recommended to use [unplugin-vue-router](https://github.com/posva/unplugin-vue-router) to generate the routes and the types automatically.

:::
