# Named Routes

<VueSchoolLink
  href="https://vueschool.io/lessons/named-routes"
  title="Learn about the named routes"
/>

Alongside the `path`, you can provide a `name` to any route. This has the following advantages:

- No hardcoded URLs
- Automatic encoding/decoding of `params`
- Prevents you from having a typo in the url
- Bypassing path ranking (e.g. to display a )

```js
const routes = [
  {
    path: '/user/:username',
    name: 'user',
    component: User
  }
]
```

To link to a named route, you can pass an object to the `router-link` component's `to` prop:

```html
<router-link :to="{ name: 'user', params: { username: 'erina' }}">
  User
</router-link>
```

This is the exact same object used programmatically with `router.push()`:

```js
router.push({ name: 'user', params: { username: 'erina' } })
```

In both cases, the router will navigate to the path `/user/erina`.

Full example [here](https://github.com/vuejs/vue-router/blob/dev/examples/named-routes/app.js).

Each name **must be unique** across all routes. If you add the same name to multiple routes, the router will only keep the last one. You can read more about this [in the Dynamic Routing](../advanced/dynamic-routing.md#removing-routes) section.
