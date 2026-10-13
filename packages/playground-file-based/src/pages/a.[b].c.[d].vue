<script lang="ts" setup>
import { useRoute } from 'vue-router'

const props = defineProps<{
  d: string
  b: number
}>()

definePage({
  props: true,
  params: {
    path: {
      d: 'string',
      b: 'int',
    },
  },
})

const route = useRoute()
</script>

<template>
  <h1>{{ String(route.name) }} - {{ route.path }}</h1>
  <p>b x 100: {{ props.b * 100 }}</p>
  <pre>{{ route.params }}</pre>
</template>
