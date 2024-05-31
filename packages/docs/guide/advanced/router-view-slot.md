# RouterView slot

The RouterView component exposes a slot that can be used to render the route component:

```vue-html
<router-view v-slot="{ Component }">
  <component :is="Component" />
</router-view>
```

The code above is equivalent to using `<router-view />` without the slot, but the slot provides extra flexibility when we want to work with other features.

## KeepAlive & Transition

When working with the [KeepAlive](https://vuejs.org/guide/built-ins/keep-alive.html) component, we would usually want it to keep the route components alive, not the RouterView itself. We can achieve that by putting the KeepAlive inside the slot:

```vue-html
<router-view v-slot="{ Component }">
  <keep-alive>
    <component :is="Component" />
  </keep-alive>
</router-view>
```

Similarly, the slot allows us to use a [Transition](https://vuejs.org/guide/built-ins/transition.html) component to transition between route components:

```vue-html
<router-view v-slot="{ Component }">
  <transition>
    <component :is="Component" />
  </transition>
</router-view>
```

We can also use KeepAlive inside a Transition:

```vue-html
<router-view v-slot="{ Component }">
  <transition>
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

For more information about using RouterView with the Transition component, see the [Transitions](./transitions) guide.

## Passing props and slots

We can use the slot to pass props or slots to the route component:

```vue-html
<router-view v-slot="{ Component }">
  <component :is="Component" some-prop="a value">
    <p>Some slotted content</p>
  </component>
</router-view>
```

In practice, this usually isn't something you would want to do, as the route components would **all need to use the same props and slots**. See [Passing Props to Route Components](../essentials/passing-props) for other ways to pass props.

## Template refs

Using the slot allows us to put a [template ref](https://vuejs.org/guide/essentials/template-refs.html) directly on the route component:

```vue-html
<router-view v-slot="{ Component }">
  <component :is="Component" ref="mainContent" />
</router-view>
```

If we put the ref on the `<router-view>` instead then the ref would be populated with the RouterView instance, rather than the route component.
