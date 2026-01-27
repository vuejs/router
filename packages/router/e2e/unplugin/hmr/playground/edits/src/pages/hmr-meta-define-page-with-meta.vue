<script setup lang="ts">
definePage({
  meta: {
    hello: 'world',
  },
})
</script>

<template>
  <main>
    <h1>HMR Meta Test</h1>
    <pre data-testid="meta-hello">{{ $route.meta.hello }}</pre>
  </main>
</template>
