<script setup lang="ts">
defineProps()
definePage({ props: true })
</script>

<template>
  <pre data-testid="child-props">{{ Object.keys($props).join() }}</pre>
</template>
