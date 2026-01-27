<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()

route.params.userId
route.params.anyParam
route.params.page

definePage({
  // this doesn't work in custom param version and should warn
  // path: '/users/:userId',
  params: {
    query: {
      anyParam: {
        default: '',
      },
      page: {
        parser: 'int',
        default: 1,
        format: 'value',
      },
    },
  },
  meta: {
    // te: 3, 2
  },
})
</script>

<template>
  <h1>{{ String($route.name) }} - {{ $route.path }}</h1>

  <pre>{{ route.params }}</pre>
</template>
