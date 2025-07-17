<template>
  <section>
    <div class="long" id="top">
      This one is long: {{ route.params.n }}. Go down to click on a link
    </div>
    <p class="long">
      <router-link
        :to="{ name: 'long', params: { n: Number(route.params.n || 0) + 1 } }"
        >/long-{{ Number(route.params.n || 0) + 1 }}</router-link
      >
    </p>
    <a href="#top">Go to top</a>
  </section>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute<'long'>()
</script>
