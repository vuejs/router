<script setup lang="ts">
definePage({
  meta: {
    foo: 'bar',
  },
})
</script>

<template>
  <main>
    <h1>HMR Update Test</h1>
    <pre data-testid="meta-foo">{{ $route.meta.foo }}</pre>
  </main>
</template>
