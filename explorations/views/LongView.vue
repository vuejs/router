<template>
  <section>
    <div class="long">
      This one is long: {{ route.params.n }}. Go down to click on a link
    </div>
    <p class="long">
      <router-link
        :to="{ name: 'long', params: { n: Number(route.params.n || 0) + 1 } }"
        >/long-{{ Number(route.params.n || 0) + 1 }}</router-link
      >
    </p>
  </section>
</template>

<script>
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'LongView',
  setup() {
    const route = inject('route')
    return { route }
  },
})
</script>
