# RouterView slot

The RouterView component exposes a slot that can be used to render the route component:

```vue-html
<router-view v-slot="{ Component }"
  <component :is="Component" />
</router-view>
```

The code above is equivalent to using `<router-view />` without the slot, but the slot provides extra flexibility when we want to work with other features.

## Passing props and slots

We could use the slot to pass props or slots to the route component:

```vue-html
<router-view v-slot="{ Component }"
  <component :is="Component" some-prop="a value">
    <p>Some slotted content</p>
  </component>
</router-view>
```

In practice, this usually isn't something you would want to do, as the route components would all need to use the same props and slots. See [Passing Props to Route Components](/guide/essentials/passing-props) for other ways to pass props.

## Template refs

Using the slot also allows us to put a [template ref](https://vuejs.org/guide/essentials/template-refs.html) directly on the route component:

```vue-html
<router-view v-slot="{ Component }"
  <component :is="Component" ref="mainContent" />
</router-view>
```

If we put the ref on the `<router-view>` instead then the ref would be populated with the RouterView instance, rather than the route component.

## KeepAlive

The slot is also useful for working with the [KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html) component. We want the KeepAlive to apply to the route component, not the RouterView itself, so we can put the KeepAlive inside the slot:

```vue-html
<router-view v-slot="{ Component }">
  <keep-alive>
    <component :is="Component" />
  </keep-alive>
</router-view>
```

Similarly, we can also combine both KeepAlive and Transition:

```vue-html
<router-view v-slot="{ Component }">
  <transition>
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

For more information about using RouterView with the Transition component, see the [Transitions](/guide/advanced/transitions) guide.

## Slot props

In addition to the `Component`, the RouterView also exposes the current route via the `route` slot prop:

```vue-html
<router-view v-slot="{ Component, route }">
  ...
</router-view>
```

While `route` is equivalent to the global `$route`, it can be more convenient when working with [render functions](https://vuejs.org/guide/extras/render-function.html).
