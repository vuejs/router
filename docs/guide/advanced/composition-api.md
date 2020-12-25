# Vue Router and the Composition API

The introduction of `setup` and Vue's [Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html), open up new possibilities but to be able to get the full potential out of Vue Router, we will need to use a few new functions to replace access to `this` and in-component navigation guards.

## Accessing the Router and current Route inside `setup`

Because we don't have access to `this` inside of `setup`, we cannot directly access `this.$router` or `this.$route` anymore. Instead we use the `useRouter` function:

```js
import { useRouter, useRoute } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()

    function pushWithQuery(query) {
      router.push({
        name: 'search',
        query: {
          ...route.query,
        },
      })
    }
  },
}
```

The `route` object is a reactive object, so any of its properties can be watched and you should **avoid watching the whole `route`** object:

```js
import { useRoute } from 'vue-router'

export default {
  setup() {
    const route = useRoute()
    const userData = ref()

    // fetch the user information when params change
    watch(
      () => route.params,
      async newParams => {
        userData.value = await fetchUser(newParams.id)
      }
    )
  },
}
```

Note we still have access to `$router` and `$route` in templates, so there is no need to return `router` or `route` inside of `setup`.

## Navigation Guards

While you can still use in-component navigation guards with a `setup` function, Vue Router exposes update and leave guards as Composition API functions:

```js
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

export default {
  setup() {
    // same as beforeRouteLeave option with no access to `this`
    onBeforeRouteLeave((to, from) => {
      const answer = window.confirm(
        'Do you really want to leave? you have unsaved changes!'
      )
      // cancel the navigation and stay on the same page
      if (!answer) return false
    })

    const userData = ref()

    // same as beforeRouteUpdate option with no access to `this`
    onBeforeRouteUpdate(async (to, from) => {
      // only fetch the user if the id changed as maybe only the query or the hash changed
      if (to.params.id !== from.params.id) {
        userData.value = await fetchUser(to.params.id)
      }
    })
  },
}
```

Composition API guards can also be used in any component rendered by `<router-view>`, they don't have to be used directly on the route component like in-component guards.

## `useLink`

Vue Router exposes the internal behavior of RouterLink as a Composition API function. It gives access the same properties as the [`v-slot` API](/api/#router-link-s-v-slot):

```js
import { RouterLink, useLink } from 'vue-router'

export default {
  name: 'AppLink',

  props: {
    // add @ts-ignore if using TypeScript
    ...RouterLink.props,
    inactiveClass: String,
  },

  setup(props) {
    const { route, href, isActive, isExactActive, navigate } = useLink(props)

    const isExternalLink = computed(
      () => typeof props.to === 'string' && props.to.startsWith('http')
    )

    return { isExternalLink, href, navigate, isActive }
  },
}
```
