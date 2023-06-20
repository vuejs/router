---
sidebarDepth: 0
---

# Programmatic Navigation

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-programmatic-navigation"
  title="Learn how to navigate programmatically"
/>

Aside from using `<router-link>` to create anchor tags for declarative navigation, we can do this programmatically using the router's instance methods.

## Navigate to a different location

**Note: Inside of a Vue instance, you have access to the router instance as `$router`. You can therefore call `this.$router.push`.**

To navigate to a different URL, use `router.push`. This method pushes a new entry into the history stack, so when the user clicks the browser back button they will be taken to the previous URL.

This is the method called internally when you click a `<router-link>`, so clicking `<router-link :to="...">` is the equivalent of calling `router.push(...)`.

| Declarative               | Programmatic       |
| ------------------------- | ------------------ |
| `<router-link :to="...">` | `router.push(...)` |

The argument can be a string path, or a location descriptor object. Examples:

```js
// literal string path
router.push('/users/eduardo')

// object with path
router.push({ path: '/users/eduardo' })

// named route with params to let the router build the url
router.push({ name: 'user', params: { username: 'eduardo' } })

// with query, resulting in /register?plan=private
router.push({ path: '/register', query: { plan: 'private' } })

// with hash, resulting in /about#team
router.push({ path: '/about', hash: '#team' })
```

**Note**: `params` are ignored if a `path` is provided, which is not the case for `query`, as shown in the example above. Instead, you need to provide the `name` of the route or manually specify the whole `path` with any parameter:

```js
const username = 'eduardo'
// we can manually build the url but we will have to handle the encoding ourselves
router.push(`/user/${username}`) // -> /user/eduardo
// same as
router.push({ path: `/user/${username}` }) // -> /user/eduardo
// if possible use `name` and `params` to benefit from automatic URL encoding
router.push({ name: 'user', params: { username } }) // -> /user/eduardo
// `params` cannot be used alongside `path`
router.push({ path: '/user', params: { username } }) // -> /user
```

When specifying `params`, make sure to either provide a `string` or `number` (or an array of these for [repeatable params](./route-matching-syntax.md#repeatable-params)). **Any other type (like objects, booleans, etc) will be automatically stringified**. For [optional params](./route-matching-syntax.md#optional-parameters), you can provide an empty string (`""`) or `null` as the value to remove it.

Since the prop `to` accepts the same kind of object as `router.push`, the exact same rules apply to both of them.

`router.push` and all the other navigation methods return a _Promise_ that allows us to wait till the navigation is finished and to know if it succeeded or failed. We will talk more about that in [Navigation Handling](../advanced/navigation-failures.md).

## Replace current location

It acts like `router.push`, the only difference is that it navigates without pushing a new history entry, as its name suggests - it replaces the current entry.

| Declarative                       | Programmatic          |
| --------------------------------- | --------------------- |
| `<router-link :to="..." replace>` | `router.replace(...)` |

It's also possible to directly add a property `replace: true` to the `to` argument that is passed to `router.push`:

```js
router.push({ path: '/home', replace: true })
// equivalent to
router.replace({ path: '/home' })
```

## Traverse history

<VueSchoolLink
  href="https://vueschool.io/lessons/go-back"
  title="Learn how to use Vue Router to go back"
/>

This method takes a single integer as parameter that indicates by how many steps to go forward or go backward in the history stack, similar to `window.history.go(n)`.

Examples

```js
// go forward by one record, the same as router.forward()
router.go(1)

// go back by one record, the same as router.back()
router.go(-1)

// go forward by 3 records
router.go(3)

// fails silently if there aren't that many records
router.go(-100)
router.go(100)
```

## History Manipulation

You may have noticed that `router.push`, `router.replace` and `router.go` are counterparts of [`window.history.pushState`, `window.history.replaceState` and `window.history.go`](https://developer.mozilla.org/en-US/docs/Web/API/History), and they do imitate the `window.history` APIs.

Therefore, if you are already familiar with [Browser History APIs](https://developer.mozilla.org/en-US/docs/Web/API/History_API), manipulating history will feel familiar when using Vue Router.

It is worth mentioning that Vue Router navigation methods (`push`, `replace`, `go`) work consistently no matter the kind of [`history` option](../../api/#history) is passed when creating the router instance.
