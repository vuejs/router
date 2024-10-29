# Vue Router and the Composition API

<VueSchoolLink
  href="https://vueschool.io/lessons/router-and-the-composition-api"
  title="Learn how to use Vue Router with the Composition API"
/>

The introduction of Vue's [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) opened up new possibilities, but to be able to get the full potential out of Vue Router, we will need to use a few new functions to replace access to `this` and in-component navigation guards.

## Accessing the Router and current Route inside `setup`

Because we don't have access to `this` inside of `setup`, we cannot directly access `this.$router` or `this.$route`. Instead, we use the `useRouter` and `useRoute` composables:

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function pushWithQuery(query) {
  router.push({
    name: 'search',
    query: {
      ...route.query,
      ...query,
    },
  })
}
</script>
```

The `route` object is a reactive object. In most scenarios, you should **avoid watching the whole `route`** object. Instead, you can directly watch the properties you are expecting to change:

```vue
<script setup>
import { useRoute } from 'vue-router'
import { ref, watch } from 'vue'

const route = useRoute()
const userData = ref()

// fetch the user information when params change
watch(
  () => route.params.id,
  async newId => {
    userData.value = await fetchUser(newId)
  }
)
</script>
```

Note we still have access to `$router` and `$route` in templates, so there's no need to use `useRouter` or `useRoute` if we only need those objects in the template.

## Navigation Guards

Vue Router exposes update and leave guards as Composition API functions:

```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { ref } from 'vue'

// same as beforeRouteLeave option but with no access to `this`
onBeforeRouteLeave((to, from) => {
  const answer = window.confirm(
    'Do you really want to leave? you have unsaved changes!'
  )
  // cancel the navigation and stay on the same page
  if (!answer) return false
})

const userData = ref()

// same as beforeRouteUpdate option but with no access to `this`
onBeforeRouteUpdate(async (to, from) => {
  // only fetch the user if the id changed as maybe only the query or the hash changed
  if (to.params.id !== from.params.id) {
    userData.value = await fetchUser(to.params.id)
  }
})
</script>
```

Composition API guards can also be used in any component rendered by `<router-view>`, they don't have to be used directly on the route component like in-component guards.

## `useLink`

Vue Router exposes the internal behavior of RouterLink as a composable. It accepts a reactive object like the props of `RouterLink` and exposes low-level properties to build your own `RouterLink` component or generate custom links:

```vue
<script setup>
import { RouterLink, useLink } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({
  // add @ts-ignore if using TypeScript
  ...RouterLink.props,
  inactiveClass: String,
})

const {
  // the resolved route object
  route,
  // the href to use in a link
  href,
  // boolean ref indicating if the link is active
  isActive,
  // boolean ref indicating if the link is exactly active
  isExactActive,
  // function to navigate to the link
  navigate
} = useLink(props)

const isExternalLink = computed(
  () => typeof props.to === 'string' && props.to.startsWith('http')
)
</script>
```

Note that the RouterLink's `v-slot` gives access to the same properties as the `useLink` composable.
