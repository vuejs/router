<script lang="ts" setup>
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      // name: 'date',
    },
  },
})

const route = useRoute()
route.params.name
</script>

<template>
  <h2>Nested [name] page</h2>
  <p>Too test specificity in routes</p>
</template>
