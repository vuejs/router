# Active links

It's common for applications to have a navigation component that renders a list of RouterLink components. Within that list, we might want to style links to the currently active route differently from the others.

The RouterLink component adds two CSS classes to active links, `router-link-active` and `router-link-exact-active`. To understand the difference between them, we first need to consider how Vue Router decides that a link is _active_.

## When are links active?

A RouterLink is considered to be **_active_** if:

1. It matches the same route record (i.e. configured route) as the current location.
2. It has the same values for the `params` as the current location.

If you're using [nested routes](./nested-routes), any links to ancestor routes will also be considered active if the relevant `params` match.

Other route properties, such as the [`query`](../../api/interfaces/RouteLocationBase.html#query), are not taken into account.

The path doesn't necessarily need to be a perfect match. For example, using an [`alias`](./redirect-and-alias#Alias) would still be considered a match, so long as it resolves to the same route record and `params`.

If a route has a [`redirect`](./redirect-and-alias#Redirect), it won't be followed when checking whether a link is active.

### Path prefixes

Sharing a path prefix isn't enough on its own. Consider these two top-level routes:

```js
const routes = [
  { path: '/users', component: UserList },
  { path: '/users/:id', component: UserDetails },
]
```

When the current location is `/users/1`, a link to `/users` is **not** active: the two paths belong to different route records and `/users/:id` isn't a child of `/users`. Vue Router 3 compared paths instead, which is why the [`exact` prop was removed](../migration/index.md#Removal-of-the-exact-prop-in-router-link-).

If you want the `/users` link to be active on `/users/1`, the simplest option is to declare `/users/:id` as a child of `/users`. If the routes really need to stay separate, build your own link with [`useLink`](../advanced/composition-api.md#useLink) and compare the paths yourself:

```js
const currentRoute = useRoute()
const { route, href, navigate } = useLink(props)

const isActive = computed(
  () =>
    currentRoute.path === route.value.path ||
    currentRoute.path.startsWith(route.value.path + '/')
)
```

See [Extending RouterLink](../advanced/extending-router-link) for a complete component built this way.

## Exact active links

An **_exact_** match does not include ancestor routes.

Let's imagine we have the following routes:

```js
const routes = [
  {
    path: '/user/:username',
    component: User,
    children: [
      {
        path: 'role/:roleId',
        component: Role,
      },
    ],
  },
]
```

Then consider these two links:

```vue-html
<RouterLink to="/user/erina">
  User
</RouterLink>
<RouterLink to="/user/erina/role/admin">
  Role
</RouterLink>
```

If the current location path is `/user/erina/role/admin` then these would both be considered _active_, so the class `router-link-active` would be applied to both links. But only the second link would be considered _exact_, so only that second link would have the class `router-link-exact-active`.

<RuleKitLink />

## Configuring the classes

The RouterLink component has two props, `activeClass` and `exactActiveClass`, that can be used to change the names of the classes that are applied:

```vue-html
<RouterLink
  activeClass="border-indigo-500"
  exactActiveClass="border-indigo-700"
  ...
>
```

The default class names can also be changed globally by passing the `linkActiveClass` and `linkExactActiveClass` options to `createRouter()`:

```js
const router = createRouter({
  linkActiveClass: 'border-indigo-500',
  linkExactActiveClass: 'border-indigo-700',
  // ...
})
```

See [Extending RouterLink](../advanced/extending-router-link) for more advanced customization techniques using the `v-slot` API.
