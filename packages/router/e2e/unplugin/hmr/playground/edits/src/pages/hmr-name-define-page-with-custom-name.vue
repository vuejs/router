<script setup lang="ts">
definePage({
  name: 'CustomName',
})
</script>

<template>
  <main>
    <h1>HMR Name Test</h1>
    <pre data-testid="route-name">{{ $route.name }}</pre>
  </main>
</template>
