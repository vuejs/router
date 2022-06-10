<template>
  <a
    v-if="isExternalLink"
    v-bind="attrs"
    class="router-link"
    :class="classes"
    target="_blank"
    rel="noopener noreferrer"
    :href="to"
    :tabindex="disabled ? -1 : undefined"
    :aria-disabled="disabled"
  >
    <slot />
  </a>
  <a
    v-else
    v-bind="attrs"
    class="router-link"
    :class="classes"
    :href="href"
    :tabindex="disabled ? -1 : undefined"
    :aria-disabled="disabled"
    @click="navigate"
  >
    <slot />
  </a>
</template>

<script>
import { RouterLink, START_LOCATION, useLink, useRoute } from 'vue-router'
import { computed, defineComponent, toRefs } from 'vue'

export default defineComponent({
  props: {
    ...RouterLink.props,
    disabled: Boolean,
  },

  setup(props, { attrs }) {
    const { replace, to, disabled } = toRefs(props)
    const isExternalLink = computed(
      () => typeof to.value === 'string' && to.value.startsWith('http')
    )

    const currentRoute = useRoute()

    const { route, href, isActive, isExactActive, navigate } = useLink({
      to: computed(() => (isExternalLink.value ? START_LOCATION : to.value)),
      replace,
    })

    const classes = computed(() => ({
      // allow link to be active for unrelated routes
      'router-link-active':
        isActive.value || currentRoute.path.startsWith(route.value.path),
      'router-link-exact-active':
        isExactActive.value || currentRoute.path === route.value.path,
    }))

    return { attrs, isExternalLink, href, navigate, classes, disabled }
  },
})
</script>
