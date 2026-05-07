<script lang="ts" setup>
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      b: 'int',
    },
  },
})

const route = useRoute()

function test() {
  if (route.params.b === 'ok') {
  }
}
</script>

<template>
  <h1>{{ String(route.name) }} - {{ route.path }}</h1>
  <p>b x 100: {{ route.params.b * 100 }}</p>
  <pre>{{ route.params }}</pre>
</template>
