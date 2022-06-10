<template>
  <section>
    <h1>Generic view</h1>
    <pre>{{ $route.fullPath }}</pre>
  </section>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Generic',
})
</script>
