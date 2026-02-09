<template>
  <div>
    <div>Repeated Params</div>
    <router-link :to="lessNesting">Less nesting</router-link>
    <br />
    <router-link :to="moreNesting">More nesting</router-link>
    <pre>{{ moreNesting }}</pre>
    <pre>{{ lessNesting }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute<'repeat'>()

const lessNesting = computed(() => {
  const a = [...(route.params.a || [])]
  a.pop()

  return { params: { a } }
})

const moreNesting = computed(() => {
  const a = [...(route.params.a || [])]
  a.push('more')

  return { params: { a } }
})

</script>
