# Named Routes

<VueSchoolLink
  href="https://vueschool.io/lessons/named-routes"
  title="Learn about the named routes"
/>

When creating a route, we can optionally give the route a `name`:

```js
const routes = [
  {
    path: '/user/:username',
    name: 'profile', // [!code highlight]
    component: User
  }
]
```

We can then use the `name` instead of the `path` when passing the `to` prop to `<router-link>`:

```vue-html
<router-link :to="{ name: 'profile', params: { username: 'erina' } }">
  User profile
</router-link>
```

The example above would create a link to `/user/erina`.

- [See it in the Playground](https://play.vuejs.org/#eNqtVVtP2zAU/itWNqlFauNNIB6iUMEQEps0NjH2tOzBtKY1JLZlO6VTlP++4+PcelnFwyRofe7fubaKCiZk/GyjJBKFVsaRiswNZ45faU1q8mRUQUbrko8yuaPwlRfK/LkV1sHXpGHeq9JxMzScGmT19t5xkMaUaR1vOb9VBe+kntgWXz2Cs06O1LbCTwvRW7knGnEm50paRwIYcrEFd1xlkpBVyCQ5lN74ZOJV0Nom5JcnCFRCM7dKyIiOJkSygsNzBZiBmivAI7l0SUipRvuhCfPge7uWHBiGZPctS0iLJv7T2/YutFFPIt+JjgUJPn7DZ32CtWg7PIZ/4BASg7txKE6gC1VKNx69gw6NTqJJ1HQK5iR1vNA52M+8Yrr6OLuD+AuCtbQpBQYK9Oy6NAZAhLI1KKuKvEc69jSp65Tqw/oh3V7f00P9MsdveOWiecE75DDNhXwhiVMXWVRttYbUWdRpE2xOZ0sHxq1v2jl/a5jQyZ042Mv/HKjvt2aGFTCXFWmnAsTcCMkAxw4SHIjG9E2AUtpUusWyFvyVUGCltBsFmJB2W/dHZCHWswdYLwJ/XiulnrNr323zcQeodthDuAHTgmm4aEqCH1zsrBHYLIISheyyqD9Nnp1FK+e0TSgtpX5ZxrBBtNe4PItP4w8Q07oBN+a2mD4a9erPzDN4bzY1iy5BiS742imV2ynT4l8h9hQvz+Pz+COU/pGCdyrkgm/Qt3ddw/5Cms7CLXsSy50k/dJDT8037QTcuq1kWZ6r1y/Ic6bkHdD5is9fDvCf7SZA/m44ZLfmg+QcM0vugvjmxx3fwLsTFmpRwlwdE95zq/LSYwxqn0q5ANgDPUT7GXsm5PLB3mwcl7ZNygPFaqA+NvL6SOo93NP4bFDF9sfh+LThtgxvkF80fyxxy/Ac7U9i/RcYNWrd).

Using a `name` has various advantages:

- No hardcoded URLs.
- Automatic encoding of `params`.
- Avoids URL typos.
- Bypassing path ranking, e.g. to display a lower-ranked route that matches the same path.

Each name **must be unique** across all routes. If you add the same name to multiple routes, the router will only keep the last one. You can read more about this [in the Dynamic Routing](../advanced/dynamic-routing#Removing-routes) section.

There are various other parts of Vue Router that can be passed a location, e.g. the methods `router.push()` and `router.replace()`. We'll go into more detail about those methods in the guide to [programmatic navigation](./navigation). Just like the `to` prop, these methods also support passing a location by `name`:

```js
router.push({ name: 'profile', params: { username: 'erina' } })
```
