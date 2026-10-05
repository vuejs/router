<script lang="ts" setup>
import { useRoute } from 'vue-router'

definePage({
  params: {
    hash: {
      myHash: {
        parser: 'int',
        default: 46,
      },
    },
  },
})

const route = useRoute()
console.log('Route params:', route.params)
route.params.myHash
</script>

<template>
  <h1>Hash with the integer parser</h1>
  <p>An absent or invalid hash uses the default: 46.</p>
  <ul>
    <li><RouterLink to="/test-params/hash-int">No hash → 46</RouterLink></li>
    <li><RouterLink to="/test-params/hash-int#">Bare # → 46</RouterLink></li>
    <li><RouterLink to="/test-params/hash-int#0">#0 → 0</RouterLink></li>
    <li>
      <RouterLink to="/test-params/hash">Custom hash parser</RouterLink>
    </li>
    <li>
      <RouterLink to="/test-params">All param parser examples</RouterLink>
    </li>
  </ul>

  <pre>{{ $route.params }}</pre>
</template>
