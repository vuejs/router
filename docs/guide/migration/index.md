# Migrating from Vue 2

Most of Vue Router API has remained unchanged during its rewrite from v3 (for Vue 2) to v4 (for Vue 3) but there are still a few breaking changes that you might encounter while migrating your application. This guide is here to help you understand why these changes happened and how to adapt your application to make it work with Vue Router 4.

## New Features

Some of new features to keep an eye on in Vue Router 4 include:

<!-- TODO: links -->

- Dynamic Routing
- Composition API
- Custom History implementation

## Breaking

### Improvements

The following changes should not be a problem for you but they are technically breaking changes that will show a different behavior and might break parts of your application.

### Non existent named routes

Pushing or resolving a non existent named route throws an error:

```js
// Oops, we made a typo in name
router.push({ name: 'homee' }) // throws
router.resolve({ name: 'homee' }) // throws
```

**Reason**: Previously, the router would navigate to `/` but display nothing (instead of the home page). Throwing an error makes more sense because we cannot produce a valid URL to navigate to.

### Missing required `params` on named routes

Pushing or resolving a named route without its required params will throw an error:

```js
// given the following route:
const routes = [{ path: '/users/:id', name: 'users' }]

// Missing the `id` param will fail
router.push({ name: 'users' })
router.resolve({ name: 'users' })
```

**Reason**: Same as above.

### Empty `path` in children no longer produces a trailing slash

Given any nested routes with an empty `path`:

```js
const routes = [
  {
    path: '/dashboard',
    name: 'dashboard-parent',
    children: [
      { path: '', name: 'dashboard' },
      { path: 'settings', name: 'dashboard-settings' },
    ],
  },
]
```

Navigating to the named route `dashboard` will now produce a URL **without a trailing slash**.

Both `/dashboard` and `/dashboard/` will access the named route _dashboard_ and not _dashboard-parent_

**Reason**: This is to make things consistent
