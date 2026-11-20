# URL Encoding

::: warning Experimental
This page describes the [Experimental Router](./router-resolver.md). The behavior may change.
:::

The router encodes and decodes URLs for you. The rule to remember: **give decoded values** (`params`, `query`) and **read decoded values** (`route.params`, `route.query`). A `path` in an object location must already be encoded. String locations and the `hash` are only normalized: the router encodes the characters that need it and keeps the existing percent encoded sequences.

[[toc]]

## Summary

| Part of the location | You give       | The router gives in `route` |
| -------------------- | -------------- | --------------------------- |
| String location      | encoded or not | normalized `fullPath`       |
| Object `path`        | encoded        | the same `path`             |
| `params`             | decoded        | decoded `params`            |
| `query` values       | decoded        | decoded `query`             |
| `hash`               | encoded or not | normalized `hash`           |

## Named locations and params

The router encodes each param. In a regular path param, a `/` becomes `%2F`, so the param stays one segment:

```ts
// user/[username].vue
router.push({ name: 'user', params: { username: 'eduardo/san martin' } })
// /user/eduardo%2Fsan%20martin
// route.params.username === 'eduardo/san martin'
```

Two kinds of path params keep a `/` as a separator:

```ts
// repeatable param, articles/[slugs]+.vue: each value is one segment
router.push({ name: 'articles', params: { slugs: ['a/b', 'c d'] } })
// /articles/a%2Fb/c%20d

// catch-all param, docs/[...path].vue: the value can span segments
router.push({ name: 'docs', params: { path: 'guide/intro?' } })
// /docs/guide/intro%3F
```

In all cases, `route.params` has the decoded values. This is the safest form of location. Use it when possible.

## String locations

The router normalizes a string location like a browser does with [`new URL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL). It encodes the characters that need it, keeps percent encoded sequences, and resolves `.` and `..` segments:

```ts
router.push('/user/café') // /user/caf%C3%A9
router.push('/user/caf%C3%A9') // same location
router.push('/docs/./guide/../api') // /docs/api
```

::: details Why are string locations normalized but object paths are not?

A string location often comes from outside the app: a link in some content, a URL that a user wrote, or `route.fullPath`. Normalizing it makes it safe to use as is. `new URL()` is slow compared to the other forms, so the router does not use it for an object `path`. Do not build a `path` from dynamic values. Use a named location and let the router encode the params:

```ts
router.push({ name: 'user', params: { username } }) // [!code ++]
router.push({ path: `/user/${username}` }) // [!code --]
```

:::

## Query

Give decoded query values. The router encodes them, and it decodes them again in `route.query`:

```ts
router.push({ path: '/search', query: { q: 'a&b=c' } })
// /search?q=a%26b=c
// route.query.q → ['a&b=c']
```

Do not encode query values yourself. The router encodes them a second time:

```ts
router.push({ path: '/search', query: { q: 'a b' } }) // [!code ++]
router.push({ path: '/search', query: { q: 'a%20b' } }) // [!code --]
// /search?q=a%2520b, route.query.q → ['a%20b']
```

### Spaces and `+`

In the query, the router writes a space as `+` and a `+` as `%2B`. When it reads a URL, `+` becomes a space. For spaces, all forms of a location give the same URL:

```ts
router.push({ path: '/search', query: { q: 'a b' } }) // /search?q=a+b
router.push('/search?q=a b') // /search?q=a+b
router.push('/search?q=a%20b') // /search?q=a+b
router.push('/search?q=a+b') // /search?q=a+b
// route.query.q → ['a b'] for all of them
```

To get a literal `+` from a string location, write `%2B`. In a query object, write `+`:

```ts
router.push('/search?q=c%2B%2B') // route.query.q → ['c++']
router.push({ path: '/search', query: { q: 'c++' } }) // /search?q=c%2B%2B
```

::: details Why `+` and not `%20`?

`new URL()` writes a space in the query as `%20`, but `URLSearchParams`, HTML forms, and search engines write `+`. For example, when you use a website as a search engine in Chrome's address bar, Chrome creates links like `/search?q=a+b` ([#561](https://github.com/vuejs/router/issues/561)). The router reads `+` as a space, like `URLSearchParams`, so these links work.

The router also always writes `+`, so a space in a query value always gives the same URL, whatever the form of the location. Pushing `route.fullPath` again does not change it. The router prefers this consistency over the exact output of `new URL()`.

This applies only to the query. In the path and the hash, a `+` is a `+` and a space is `%20`.

:::

## Hash

The hash is not a decoded value. The router normalizes it like setting [`url.hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash): it encodes the characters that need it and keeps every `%` as it is. `route.hash` is never decoded:

```ts
router.push({ path: '/docs', hash: '#a b' }) // /docs#a%20b
router.push({ path: '/docs', hash: '#a%20b' }) // same location
// route.hash → '#a%20b'
router.push({ path: '/docs', hash: '#100%' }) // /docs#100%
```

Because a `%` is never encoded, you cannot put the literal text `%20` in a hash: it always means a space.

::: details Why is `route.hash` not decoded?

`route.hash` is the same as [`location.hash`](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash). Decoding it can lose information when the hash has its own structure, for example an OAuth response like `#token=a%26b&state=c`. Use `decodeURIComponent()` if you need the decoded value. It throws on a lone `%` like `#100%`.

:::
