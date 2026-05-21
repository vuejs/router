<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'

definePage({
  params: {
    query: {
      test: {
        format: 'value',
        parser: 'set',
      },

      date: {
        format: 'array',
        // required: true,
        // default: () => new Date(),
        parser: 'date',
      },
    },
  },
})

const route = useRoute()
const router = useRouter()

route.params.date
console.log(route.params)

function smokeTest() {
  // never
  if (Math.random() > 1) {
    // @ts-expect-error: no null
    router.push({
      name: route.name,
      params: {
        test: null,
      },
    })

    // @ts-expect-error: no array
    router.push({
      name: route.name,
      params: {
        test: [],
      },
    })

    router.push({
      name: route.name,
      params: {
        // valid, gets trimmed by set param parser
        test: undefined,
      },
    })

    // @ts-expect-error: set must be of string
    router.push({
      name: route.name,
      params: {
        test: new Set<string | null>(),
      },
    })

    router.push({
      name: route.name,
      params: {
        test: new Set<string>(),
      },
    })
  }
}

smokeTest()
</script>

<template>
  <h1>Page B</h1>

  <pre>{{ route.params }}</pre>
</template>
