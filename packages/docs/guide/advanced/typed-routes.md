# Typed routes (v4.1.0+)

> ⚠️ This feature is still experimental and will evolve in the future

With typed routes you get type validation when calling `router.push()` as well as autocompletion for the route path. It gives you:

- Validation for [named routes](../essentials/named-routes.md) `name` and `params` properties
- Autocompletion of the `to` prop when using the `<RouterLink>` component

## Usage

In order to benefit from typed routes, it is necessary to pass the `routes` option to the `as const`:

```ts{6}
const router = createRouter({
  // ...
  routes: [
    { path: '/', name: 'home' },
    { path: '/users/:id', name: 'user' },
  ] as const, // <-- this is the important part
})
```

This will give you a **typed router instance**. Go ahead and give it a try, start typing `router.push({ name: '|'}` and hit `ctrl` + `space` to autocomplete the route name. It will also autocomplete `params` if they exist and **give you a type error** if the name doesn't exist or if the provided params are missing any required params. Note that you can push a route **with no `params` property** and this will be considered valid for the types because `params` are always kept from the current route whenever possible.

### Typed `router` instance

It is possible to type `$router` and `useRouter()` to be the same type as the `router` instance we created above. To do this, we need to extend an interface. It's recommended to do so in the `router.ts` file, right after creating the router:

```ts{5-9}
export const router = createRouter({
  // ...options
})

declare module 'vue-router' {
  interface Config {
    Router: typeof router
  }
}
```

### Typed `<RouterLink>`

It's also possible to type the `to` prop of `<RouterLink>` by overriding the global type used by Vue. You can add this in the `router.ts` file, right after the previous snippet of code:

```ts{1,9-13}
import type { RouterLinkTyped } from 'vue-router'

export const router = createRouter({
  // ...options
})

// other code

declare module 'vue' {
  interface GlobalComponents {
    RouterLink: RouterLinkTyped<typeof router>
  }
}
```

## Caveats

Currently, typed routes are inferred at runtime with complex, costly types that become slow if you have a lot of routes. If you have more than 50 routes, you will should give this a try first to see how much it impacts the compilation time of your project.

If you have [dynamic routes](../advanced/dynamic-routing.md), these cannot be typed and if you use [named routes](../essentials/named-routes.md), you won't be able to push to them so it's better not to use both at the same time.

## Troubleshooting

If you ever find something blocking you or making your types too slow, you can just remove the `as const` part to rollback to the previous version of the types. If something not mentioned here isn't working and you think it sohuld be working, please open an issue on [GitHub](https://github.com/vuejs/router/issues).
