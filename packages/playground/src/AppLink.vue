<template>
  <a
    v-if="isExternalLink"
    v-bind="attrs"
    class="router-link"
    :class="classes"
    target="_blank"
    rel="noopener noreferrer"
    :href="String(to)"
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

<script setup lang="ts">
import { START_LOCATION, useLink, useRoute } from 'vue-router'
import { computed, useAttrs,  } from 'vue'
import type { RouterLinkProps } from 'vue-router'

const { replace, to, disabled } = defineProps<RouterLinkProps & {disabled?: boolean}>()
const attrs = useAttrs()

const isExternalLink = computed(
  () => typeof to === 'string' && to.startsWith('http')
)

const currentRoute = useRoute()

const { route, href, isActive, isExactActive, navigate } = useLink({
  to: computed(() => (isExternalLink.value ? START_LOCATION : to)),
  replace,
})

const classes = computed(() => ({
  // allow link to be active for unrelated routes
  'router-link-active':
    isActive.value || currentRoute.path.startsWith(route.value.path),
  'router-link-exact-active':
    isExactActive.value || currentRoute.path === route.value.path,
}))
</script>
