# Routes' Matching Syntax

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-advanced-routes-matching-syntax"
  title="Learn how to use advanced route routes' matching syntax"
/>

Most applications will use static routes like `/about` and dynamic routes like `/users/:userId` like we just saw in [Dynamic Route Matching](./dynamic-matching.md), but Vue Router has much more to offer!

:::tip
For the sake of simplicity, all route records **are omitting the `component` property** to focus on the `path` value.
:::

## Custom regex in params

When defining a param like `:userId`, we internally use the following regex `([^/]+)` (at least one character that isn't a slash `/`) to extract params from URLs. This works well unless you need to differentiate two routes based on the param content. Imagine two routes `/:orderId` and `/:productName`, both would match the exact same URLs, so we need a way to differentiate them. The easiest way would be to add a static section to the path that differentiates them:

```js
const routes = [
  // matches /o/3549
  { path: '/o/:orderId' },
  // matches /p/books
  { path: '/p/:productName' },
]
```

But in some scenarios we don't want to add that static section `/o`/`p`. However, `orderId` is always a number while `productName` can be anything, so we can specify a custom regex for a param in parentheses:

```js
const routes = [
  // /:orderId -> matches only numbers
  { path: '/:orderId(\\d+)' },
  // /:productName -> matches anything else
  { path: '/:productName' },
]
```

Now, going to `/25` will match `/:orderId` while going to anything else will match `/:productName`. The order of the `routes` array doesn't even matter!

:::tip
Make sure to **escape backslashes (`\`)** like we did with `\d` (becomes `\\d`) to actually pass the backslash character in a string in JavaScript.
:::

## Repeatable params

If you need to match routes with multiple sections like `/first/second/third`, you should mark a param as repeatable with `*` (0 or more) and `+` (1 or more):

```js
const routes = [
  // /:chapters -> matches /one, /one/two, /one/two/three, etc
  { path: '/:chapters+' },
  // /:chapters -> matches /, /one, /one/two, /one/two/three, etc
  { path: '/:chapters*' },
]
```

This will give you an array of params instead of a string and will also require you to pass an array when using named routes:

```js
// given { path: '/:chapters*', name: 'chapters' },
router.resolve({ name: 'chapters', params: { chapters: [] } }).href
// produces /
router.resolve({ name: 'chapters', params: { chapters: ['a', 'b'] } }).href
// produces /a/b

// given { path: '/:chapters+', name: 'chapters' },
router.resolve({ name: 'chapters', params: { chapters: [] } }).href
// throws an Error because `chapters` is empty
```

These can also be combined with a custom regex by adding them **after the closing parentheses**:

```js
const routes = [
  // only match numbers
  // matches /1, /1/2, etc
  { path: '/:chapters(\\d+)+' },
  // matches /, /1, /1/2, etc
  { path: '/:chapters(\\d+)*' },
]
```

## Sensitive and strict route options 

By default, all routes are case-insensitive and match routes with or without a trailing slash. e.g. a route `/users` matches `/users`, `/users/`, and even `/Users/`. This behavior can be configured with the `strict` and `sensitive` options, they can be set both at a router and route level:

```js
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // will match /users/posva but not:
    // - /users/posva/ because of strict: true
    // - /Users/posva because of sensitive: true
    { path: '/users/:id', sensitive: true },
    // will match /users, /Users, and /users/42 but not /users/ or /users/42/
    { path: '/users/:id?' },
  ],
  strict: true, // applies to all routes
})
```

## Optional parameters

You can also mark a parameter as optional by using the `?` modifier (0 or 1):

```js
const routes = [
  // will match /users and /users/posva
  { path: '/users/:userId?' },
  // will match /users and /users/42
  { path: '/users/:userId(\\d+)?' },
]
```

Note that `*` technically also marks a parameter as optional but `?` parameters cannot be repeated.

## Debugging

If you need to dig how your routes are transformed into a regex to understand why a route isn't being matched or, to report a bug, you can use the [path ranker tool](https://paths.esm.dev/?p=AAMeJSyAwR4UbFDAFxAcAGAIJXMAAA..#). It supports sharing your routes through the URL.
