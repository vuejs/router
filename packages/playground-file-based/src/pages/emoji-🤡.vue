<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div>
    <h2>I have emoji in my filename</h2>

    <pre>{{ route }}</pre>
  </div>
</template>
