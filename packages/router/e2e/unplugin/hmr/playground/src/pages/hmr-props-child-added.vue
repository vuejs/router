<script setup lang="ts">
defineProps()
definePage({ props: true })
</script>

<template>
  <section>
    <pre data-testid="parent-props">{{ Object.keys($props).join() }}</pre>
    <RouterView />
  </section>
</template>
