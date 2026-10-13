<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const props = defineProps<{
  userId: number
  anyParam: string
  page: number
}>()

// route.params.userId
// route.params.anyParam
// route.params.page

definePage({
  props: true,
  // path: '/users/:userId(\\d+)',
  // this doesn't work in custom param version and should warn
  // path: '/users/:userId',
  params: {
    path: {
      // id: 'int',
    },
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
  <h1>User by id - {{ $route.path }}</h1>

  <pre>{{ route.params }}</pre>
</template>
