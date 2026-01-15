<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import doc from '../main.ts?raw'

const route = useRoute()
const router = useRouter()
route.params.path

console.log('typeof', typeof route.params.active)
console.log('value', route.params.active)
console.log('typeof', typeof route.params.other)
console.log('value', route.params.other)

definePage({
  meta: {
    title: 'Not Found',
    description: 'This page does not exist.',
    docLength: doc.length,
    number: 27,
  },
  name: 'not-found',
  params: {
    query: {
      page: {
        parser: 'int',
        default: 1,
        format: 'value',
      },
      other: {
        parser: 'bool',
        default: false,
      },
      active: {
        parser: 'bool',
        default: true,
      },

      multi: {
        format: 'array',
      },

      req: {
        parser: 'int',
        default: -1,
      },

      when: {
        parser: 'date',
        default: () => new Date(),
      },
    },
  },
})
</script>

<template>
  <main>
    <h1>Not Found</h1>

    <pre>{{ $route.params }}</pre>
    <pre>{{ $route.query }}</pre>
    <pre>{{ $route.meta }}</pre>
  </main>
</template>

<route lang="json">
{
  "meta": {
    "from block": true
  }
}
</route>
