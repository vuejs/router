# Passing Props to Route Components

<VueSchoolLink
  href="https://vueschool.io/lessons/route-props"
  title="Learn how to pass props to route components"
/>

Using `$route` or `useRoute()` in your component creates a tight coupling with the route which limits the flexibility of the component as it can only be used on certain URLs. While this is not necessarily a bad thing, we can decouple this behavior with a `props` option.

Let's return to our earlier example:

```vue [User.vue]
<template>
  <div>
    User {{ $route.params.id }}
  </div>
</template>
```

with:

```js
import User from './User.vue'

// these are passed to `createRouter`
const routes = [
  { path: '/users/:id', component: User },
]
```

We can remove the direct dependency on `$route` in `User.vue` by declaring a prop instead:

::: code-group

```vue [Composition API]
<!-- User.vue -->
<script setup>
defineProps({
  id: String
})
</script>

<template>
  <div>
    User {{ id }}
  </div>
</template>
```

```vue [Options API]
<!-- User.vue -->
<script>
export default {
  props: {
    id: String
  }
}
</script>

<template>
  <div>
    User {{ id }}
  </div>
</template>
```

:::

We can then configure the route to pass the `id` param as a prop by setting `props: true`:

```js
const routes = [
  { path: '/user/:id', component: User, props: true }
]
```

This allows you to use the component anywhere, which makes the component easier to reuse and test.

## Boolean mode

When `props` is set to `true`, the `route.params` will be set as the component props.

## Named views

For routes with named views, you have to define the `props` option for each named view:

```js
const routes = [
  {
    path: '/user/:id',
    components: { default: User, sidebar: Sidebar },
    props: { default: true, sidebar: false }
  }
]
```

## Object mode

When `props` is an object, this will be set as the component props as-is. Useful for when the props are static.

```js
const routes = [
  {
    path: '/promotion/from-newsletter',
    component: Promotion,
    props: { newsletterPopup: false }
  }
]
```

## Function mode

You can create a function that returns props. This allows you to cast parameters into other types, combine static values with route-based values, etc.

```js
const routes = [
  {
    path: '/search',
    component: SearchUser,
    props: route => ({ query: route.query.q })
  }
]
```

The URL `/search?q=vue` would pass `{query: 'vue'}` as props to the `SearchUser` component.

Try to keep the `props` function stateless, as it's only evaluated on route changes. Use a wrapper component if you need state to define the props, that way Vue can react to state changes.

## Via RouterView

You can also pass any props via the [`<RouterView>` slot](../advanced/router-view-slot):

```vue-html
<RouterView v-slot="{ Component }">
  <component
    :is="Component"
    view-prop="value"
   />
</RouterView>
```

::: warning
In this case, **all view components** will receive `view-prop`. This is usually not a good idea as  it means that all of the view components have declared a `view-prop` prop, which is not necessarily true. If possible, use any of the options above.
:::

<RuleKitLink />
